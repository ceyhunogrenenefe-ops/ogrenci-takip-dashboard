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
      role: { in: ["SALES_REP", "ADMIN", "SUPER_ADMIN"] },
      ...(isAdmin(session.role) ? {} : { id: session.id }),
    },
    select: {
      id: true,
      name: true,
      role: true,
      callsMade: true,
      contactsReached: true,
      conversions: true,
      _count: {
        select: {
          assignedCustomers: {
            where: {
              stage: { slug: { not: "iptal" } },
            },
          },
        },
      },
    },
  });

  const converted = await prisma.customer.groupBy({
    by: ["assignedUserId"],
    where: {
      companyId: session.companyId,
      stage: { slug: "kayit-oldu" },
      updatedAt: { gte: start },
    },
    _count: true,
    _sum: { revenue: true },
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
    const conv = converted.find((c) => c.assignedUserId === u.id);
    const msg = messages.find((m) => m.senderId === u.id);
    const active = u._count.assignedCustomers;
    const conversions = conv?._count || 0;
    const rate = active ? Math.round((conversions / Math.max(active, 1)) * 100) : 0;
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      callsMade: u.callsMade,
      contactsReached: u.contactsReached,
      activeConversations: active,
      conversions: u.conversions,
      periodConversions: conversions,
      revenue: conv?._sum.revenue || 0,
      messagesSent: msg?._count || 0,
      conversionRate: rate,
    };
  });

  const totals = {
    leads: await prisma.customer.count({
      where: { companyId: session.companyId, createdAt: { gte: start } },
    }),
    tasksDue: await prisma.task.count({
      where: {
        companyId: session.companyId,
        status: "PENDING",
        dueAt: { lte: now },
      },
    }),
    unreadNotifications: await prisma.notification.count({
      where: { userId: session.id, read: false },
    }),
  };

  return NextResponse.json({ range, start, stats, totals });
}
