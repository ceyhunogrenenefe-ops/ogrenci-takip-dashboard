import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, Role } from "@crm/db";
import { hashPassword, setSessionCookie, signToken } from "@/lib/auth";

const schema = z.object({
  companyName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik veya hatalı alanlar" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 409 });
  }

  const password = await hashPassword(parsed.data.password);
  const company = await prisma.company.create({
    data: {
      name: parsed.data.companyName,
      users: {
        create: {
          name: parsed.data.name,
          email,
          password,
          role: Role.SUPER_ADMIN,
          stats: { create: {} },
        },
      },
    },
    include: { users: true },
  });

  const user = company.users[0];
  const token = await signToken({
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
  });
}
