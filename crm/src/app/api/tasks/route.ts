import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/automation";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const view = req.nextUrl.searchParams.get("view") || "week";

  const start = from ? new Date(from) : new Date();
  if (!from) start.setHours(0, 0, 0, 0);
  const end = to
    ? new Date(`${to}T23:59:59`)
    : new Date(start.getTime() + (view === "day" ? 1 : 7) * 86400_000);

  const tasks = await prisma.task.findMany({
    where: {
      companyId: session.companyId,
      dueAt: { gte: start, lte: end },
      ...(session.role === "SALES_REP" ? { assigneeId: session.id } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { dueAt: "asc" },
  });

  return NextResponse.json({ tasks, range: { from: start, to: end } });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schema = z.object({
    customerId: z.string(),
    title: z.string().min(2),
    dueAt: z.string(),
    assigneeId: z.string().optional(),
  });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz görev" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, companyId: session.companyId },
  });
  if (!customer) return NextResponse.json({ error: "Müşteri yok" }, { status: 404 });

  const task = await prisma.task.create({
    data: {
      companyId: session.companyId,
      customerId: customer.id,
      assigneeId: parsed.data.assigneeId || session.id,
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
    },
  });

  await logActivity({
    customerId: customer.id,
    userId: session.id,
    type: "task",
    summary: `Görev eklendi: ${task.title}`,
  });

  await prisma.notification.create({
    data: {
      companyId: session.companyId,
      userId: task.assigneeId,
      title: "Yeni görev",
      body: `${task.title} — ${customer.name}`,
    },
  });

  return NextResponse.json({ task });
}
