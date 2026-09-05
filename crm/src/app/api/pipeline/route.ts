import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeadSource } from "@/lib/types";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || "";
  const grade = sp.get("grade") || "";
  const source = sp.get("source") || "";
  const assignedUserId = sp.get("assignedUserId") || "";
  const from = sp.get("from");
  const to = sp.get("to");

  const where: Prisma.CustomerWhereInput = {
    companyId: session.companyId,
  };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { notes: { contains: q } },
    ];
  }
  if (grade) where.grade = grade;
  if (source) where.source = source as LeadSource;
  if (assignedUserId) where.assignedUserId = assignedUserId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59`);
  }

  const stages = await prisma.pipelineStage.findMany({
    where: { companyId: session.companyId },
    orderBy: { position: "asc" },
    include: {
      customers: {
        where,
        orderBy: { lastActivityAt: "desc" },
        include: {
          assignedUser: { select: { id: true, name: true } },
        },
      },
    },
  });

  const users = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
      role: { in: ["SALES_REP", "ADMIN", "SUPER_ADMIN"] },
      active: true,
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const board = stages.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    color: s.color,
    position: s.position,
    count: s.customers.length,
    revenue: s.customers.reduce((sum, c) => sum + c.revenue, 0),
    customers: s.customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      grade: c.grade,
      source: c.source,
      tags: c.tags,
      revenue: c.revenue,
      lastActivityAt: c.lastActivityAt,
      assignedUser: c.assignedUser,
    })),
  }));

  return NextResponse.json({ stages: board, users });
}
