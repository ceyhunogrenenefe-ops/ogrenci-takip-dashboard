import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const view = req.nextUrl.searchParams.get("view") || "week";
  const start = from ? new Date(from) : new Date();
  if (!from) start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + (view === "day" ? 1 : 7) * 86400_000);

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { gte: start, lte: end },
      customer: { companyId: session.companyId },
      ...(session.role === "SALES" ? { userId: session.id } : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      ...t,
      dueAt: t.dueDate,
      assignee: t.user,
    })),
    range: { from: start, to: end },
  });
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
      customerId: customer.id,
      userId: parsed.data.assigneeId || session.id,
      title: parsed.data.title,
      dueDate: new Date(parsed.data.dueAt),
    },
  });

  return NextResponse.json({ task });
}
