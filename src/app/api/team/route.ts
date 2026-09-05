import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
      ...(isAdmin(session.role) ? {} : { id: session.id }),
    },
    orderBy: { name: "asc" },
    include: { stats: true },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      callsMade: u.stats?.totalCalls || 0,
      conversions: u.stats?.conversions || 0,
      active: true,
    })),
  });
}
