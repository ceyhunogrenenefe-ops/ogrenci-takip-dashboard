import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie, signToken } from "@/lib/auth";
import type { Role } from "@/lib/types";

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
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 409 });
  }

  const slugBase = parsed.data.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const slug = `${slugBase || "sirket"}-${Date.now().toString(36)}`;

  const passwordHash = await hashPassword(parsed.data.password);

  const company = await prisma.company.create({
    data: {
      name: parsed.data.companyName,
      slug,
      plan: "BASIC",
      pipelineStages: {
        create: [
          { name: "Gelen Müşteriler", slug: "gelen-musteriler", color: "#94a3b8", position: 0 },
          { name: "İrtibata Geçildi", slug: "irtibata-gecildi", color: "#3b82f6", position: 1 },
          { name: "Düşünme Aşamasında", slug: "dusunme", color: "#eab308", position: 2 },
          { name: "Deneme Dersi", slug: "deneme-dersi", color: "#06b6d4", position: 3 },
          { name: "Kayıt Oldu", slug: "kayit-oldu", color: "#22c55e", position: 4 },
          { name: "İptal / İlgisiz", slug: "iptal", color: "#64748b", position: 5 },
        ],
      },
      automations: {
        create: [
          {
            name: "Yeni lead round-robin",
            triggerType: "LEAD_CREATED",
            actionType: "ASSIGN_ROUND_ROBIN",
            enabled: true,
          },
        ],
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name: parsed.data.name,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  const token = await signToken({
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    name: user.name,
    role: user.role as Role,
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
