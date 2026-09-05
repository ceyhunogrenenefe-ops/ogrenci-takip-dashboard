import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, canWrite } from "@/lib/auth";
import { prisma, Status, LEAD_SOURCES } from "@crm/db";
import { createSystemMessage } from "@/lib/automation";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schema = z.object({
    name: z.string().min(2),
    phone: z.string().min(5),
    grade: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    assignedUserId: z.string().optional(),
  });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz müşteri verisi" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      companyId: session.companyId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      className: parsed.data.grade,
      source: parsed.data.source || "OTHER",
      notes: parsed.data.notes,
      status: Status.NEW,
      assignedToId: parsed.data.assignedUserId || session.id,
    },
  });

  await createSystemMessage(customer.id, "Yeni lead oluşturuldu");

  // Round-robin-ish: if no assignee beyond self, leave as is
  return NextResponse.json({ customer });
}
