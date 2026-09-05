import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/automation";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const since = req.nextUrl.searchParams.get("since");
  const messages = await prisma.message.findMany({
    where: {
      customerId: params.id,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schema = z.object({
    content: z.string().min(1),
    sendWhatsApp: z.boolean().optional(),
  });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      customerId: customer.id,
      senderId: session.id,
      type: "TEXT",
      content: parsed.data.content,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lastActivityAt: new Date() },
  });
  await logActivity({
    customerId: customer.id,
    userId: session.id,
    type: "message",
    summary: "Mesaj gönderildi",
  });
  await prisma.user.update({
    where: { id: session.id },
    data: {
      callsMade: { increment: 1 },
      contactsReached: { increment: 1 },
    },
  });

  let whatsapp: unknown = null;
  if (parsed.data.sendWhatsApp && customer.phone) {
    const url = process.env.WHATSAPP_API_URL;
    if (url) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: customer.phone, message: parsed.data.content }),
        });
        whatsapp = await res.json();
      } catch (e) {
        whatsapp = { error: String(e) };
      }
    }
  }

  return NextResponse.json({ message, whatsapp });
}
