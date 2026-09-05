import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const range = req.nextUrl.searchParams.get("range") || "week";
  const now = new Date();
  const start = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else if (range === "month") start.setDate(1);
  else start.setDate(start.getDate() - 7);

  const users = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
      role: { in: ["SALES", "ADMIN", "SUPER_ADMIN"] },
      ...(isAdmin(session.role) ? {} : { id: session.id }),
    },
    include: {
      stats: true,
      _count: {
        select: {
          assignedCustomers: { where: { status: { not: "LOST" } } },
        },
      },
    },
  });

  const won = await prisma.customer.groupBy({
    by: ["assignedToId"],
    where: {
      companyId: session.companyId,
      status: "WON",
      createdAt: { gte: start },
    },
    _count: true,
  });

  const messages = await prisma.message.groupBy({
    by: ["senderId"],
    where: {
      type: "TEXT",
      createdAt: { gte: start },
      sender: { companyId: session.companyId },
    },
    _count: true,
  });

  const stats = users.map((u) => {
    const periodConversions = won.find((c) => c.assignedToId === u.id)?._count || 0;
    const active = u._count.assignedCustomers;
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      callsMade: u.stats?.totalCalls || 0,
      contactsReached: u.stats?.reached || 0,
      activeConversations: active,
      conversions: u.stats?.conversions || 0,
      periodConversions,
      revenue: periodConversions * 4500,
      messagesSent: messages.find((m) => m.senderId === u.id)?._count || 0,
      conversionRate: active ? Math.round((periodConversions / Math.max(active, 1)) * 100) : 0,
    };
  });

  const totals = {
    leads: await prisma.customer.count({
      where: { companyId: session.companyId, createdAt: { gte: start } },
    }),
    tasksDue: await prisma.task.count({
      where: {
        status: "PENDING",
        dueDate: { lte: now },
        customer: { companyId: session.companyId },
      },
    }),
    unreadNotifications: 0,
  };

  return NextResponse.json({ range, start, stats, totals });
}
