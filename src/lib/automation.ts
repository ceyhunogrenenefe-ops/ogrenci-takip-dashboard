import { prisma } from "@/lib/prisma";

export async function bumpStats(
  userId: string,
  fields: Partial<{ totalCalls: number; reached: number; conversions: number }>
) {
  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalCalls: fields.totalCalls || 0,
      reached: fields.reached || 0,
      conversions: fields.conversions || 0,
    },
    update: {
      ...(fields.totalCalls != null ? { totalCalls: { increment: fields.totalCalls } } : {}),
      ...(fields.reached != null ? { reached: { increment: fields.reached } } : {}),
      ...(fields.conversions != null ? { conversions: { increment: fields.conversions } } : {}),
    },
  });
}

export async function createSystemMessage(customerId: string, content: string) {
  return prisma.message.create({
    data: { customerId, type: "SYSTEM", content },
  });
}
