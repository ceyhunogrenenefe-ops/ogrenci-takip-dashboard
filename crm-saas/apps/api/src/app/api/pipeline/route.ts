import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma, STATUS_COLUMNS, type Status, type Prisma } from "@crm/db";

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

  const where: Prisma.CustomerWhereInput = { companyId: session.companyId };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }
  if (grade) where.className = grade;
  if (source) where.source = source;
  if (assignedUserId) where.assignedToId = assignedUserId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59`);
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });

  const users = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
      role: { in: ["SALES", "ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const stages = STATUS_COLUMNS.map((col) => {
    const list = customers.filter((c) => c.status === col.key);
    return {
      id: col.key,
      name: col.name,
      slug: col.key.toLowerCase(),
      color: col.color,
      count: list.length,
      revenue: list.filter((c) => c.status === "WON").length * 4500,
      customers: list.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        grade: c.className,
        source: c.source,
        status: c.status,
        tags: "[]",
        revenue: c.status === "WON" ? 4500 : 0,
        lastActivityAt: c.createdAt,
        assignedUser: c.assignedTo,
      })),
    };
  });

  return NextResponse.json({ stages, users });
}

export async function PATCH(req: NextRequest) {
  // unused placeholder
  return NextResponse.json({ ok: true });
}
