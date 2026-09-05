import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSystemMessage, logActivity, runAutomations } from "@/lib/automation";
import { stringifyTags } from "@/lib/utils";
import { LEAD_SOURCES, type LeadSource } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schema = z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
    grade: z.string().optional(),
    source: z.enum(LEAD_SOURCES as [LeadSource, ...LeadSource[]]).optional(),
    notes: z.string().optional(),
    assignedUserId: z.string().optional(),
    stageId: z.string().optional(),
  });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz müşteri verisi" }, { status: 400 });
  }

  const firstStage =
    parsed.data.stageId ||
    (
      await prisma.pipelineStage.findFirst({
        where: { companyId: session.companyId },
        orderBy: { position: "asc" },
      })
    )?.id;

  if (!firstStage) {
    return NextResponse.json({ error: "Pipeline aşaması yok" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      companyId: session.companyId,
      stageId: firstStage,
      name: parsed.data.name,
      phone: parsed.data.phone,
      grade: parsed.data.grade,
      source: parsed.data.source || "OTHER",
      notes: parsed.data.notes,
      assignedUserId: parsed.data.assignedUserId || session.id,
      tags: stringifyTags([]),
    },
  });

  await logActivity({
    customerId: customer.id,
    userId: session.id,
    type: "created",
    summary: `${session.name} yeni müşteri ekledi`,
  });
  await createSystemMessage(customer.id, "Yeni lead oluşturuldu");
  await runAutomations({
    companyId: session.companyId,
    customerId: customer.id,
    triggerType: "LEAD_CREATED",
  });

  return NextResponse.json({ customer });
}
