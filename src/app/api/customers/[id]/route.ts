import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, canWrite } from "@/lib/auth";
import { Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bumpStats, createSystemMessage } from "@/lib/automation";

type Ctx = { params: { id: string } };

async function loadCustomer(id: string, companyId: string) {
  return prisma.customer.findFirst({
    where: { id, companyId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { user: { select: { id: true, name: true } } },
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
      grade: customer.className,
      stageId: customer.status,
      stage: { name: customer.status },
      assignedUserId: customer.assignedToId,
      assignedUser: customer.assignedTo,
      tags: [],
      activities: [],
      tasks: customer.tasks.map((t) => ({
        ...t,
        dueAt: t.dueDate,
        assignee: t.user,
      })),
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
    source: z.string().optional(),
    assignedUserId: z.string().nullable().optional(),
    stageId: z.nativeEnum(Status).optional(),
    status: z.nativeEnum(Status).optional(),
  });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz güncelleme" }, { status: 400 });
  }

  const nextStatus = parsed.data.status || parsed.data.stageId;
  const data: Record<string, unknown> = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;
  if (parsed.data.grade !== undefined) data.className = parsed.data.grade;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.source) data.source = parsed.data.source;
  if (parsed.data.assignedUserId !== undefined) data.assignedToId = parsed.data.assignedUserId;
  if (nextStatus) data.status = nextStatus;

  if (nextStatus && nextStatus !== existing.status) {
    await createSystemMessage(
      existing.id,
      `Aşama değişti: ${nextStatus} (${session.name})`
    );
    if (nextStatus === "WON") {
      await bumpStats(session.id, { conversions: 1 });
    }
  }

  await prisma.customer.update({ where: { id: existing.id }, data });
  const full = await loadCustomer(existing.id, session.companyId);
  return NextResponse.json({
    customer: full
      ? {
          ...full,
          grade: full.className,
          stageId: full.status,
          stage: { name: full.status },
          assignedUserId: full.assignedToId,
          assignedUser: full.assignedTo,
          tags: [],
          activities: [],
          tasks: full.tasks.map((t) => ({
            ...t,
            dueAt: t.dueDate,
            assignee: t.user,
          })),
        }
      : null,
  });
}
