import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSystemMessage, logActivity, runAutomations } from "@/lib/automation";
import { parseTags, stringifyTags } from "@/lib/utils";
import { LEAD_SOURCES, type LeadSource } from "@/lib/types";

type Ctx = { params: { id: string } };

async function loadCustomer(id: string, companyId: string) {
  return prisma.customer.findFirst({
    where: { id, companyId },
    include: {
      stage: true,
      assignedUser: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, name: true } } },
      },
      tasks: {
        orderBy: { dueAt: "asc" },
        include: { assignee: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await loadCustomer(params.id, session.companyId);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    customer: {
      ...customer,
      tags: parseTags(customer.tags),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.customer.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().nullable().optional(),
    grade: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    source: z.enum(LEAD_SOURCES as [LeadSource, ...LeadSource[]]).optional(),
    assignedUserId: z.string().nullable().optional(),
    stageId: z.string().optional(),
    revenue: z.number().optional(),
    tags: z.array(z.string()).optional(),
    addTag: z.string().optional(),
  });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz güncelleme" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  delete data.tags;
  delete data.addTag;

  let tags = parseTags(existing.tags);
  if (parsed.data.tags) tags = parsed.data.tags;
  if (parsed.data.addTag && !tags.includes(parsed.data.addTag)) {
    tags = [...tags, parsed.data.addTag];
  }
  data.tags = stringifyTags(tags);

  if (parsed.data.stageId && parsed.data.stageId !== existing.stageId) {
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: parsed.data.stageId, companyId: session.companyId },
    });
    if (!stage) return NextResponse.json({ error: "Aşama yok" }, { status: 400 });
    await createSystemMessage(
      existing.id,
      `Aşama değişti: ${stage.name} (${session.name})`
    );
    await logActivity({
      customerId: existing.id,
      userId: session.id,
      type: "stage_change",
      summary: `Aşama → ${stage.name}`,
    });
    if (stage.slug === "kayit-oldu") {
      await prisma.user.update({
        where: { id: session.id },
        data: { conversions: { increment: 1 } },
      });
      if (!parsed.data.revenue && existing.revenue === 0) {
        data.revenue = 4500;
      }
    }
  }

  const customer = await prisma.customer.update({
    where: { id: existing.id },
    data,
  });

  if (parsed.data.addTag === "deneme-booked") {
    await runAutomations({
      companyId: session.companyId,
      customerId: existing.id,
      triggerType: "TAG_ADDED",
      triggerValue: "deneme-booked",
    });
  }

  await logActivity({
    customerId: existing.id,
    userId: session.id,
    type: "updated",
    summary: `${session.name} müşteri kartını güncelledi`,
  });

  const full = await loadCustomer(customer.id, session.companyId);
  return NextResponse.json({
    customer: full ? { ...full, tags: parseTags(full.tags) } : customer,
  });
}
