import { prisma } from "@crm/db";

export async function bumpStats(
  userId: string,
  patch: Partial<{ totalCalls: number; reached: number; conversions: number }>
) {
  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalCalls: patch.totalCalls || 0,
      reached: patch.reached || 0,
      conversions: patch.conversions || 0,
    },
    update: {
      ...(patch.totalCalls ? { totalCalls: { increment: patch.totalCalls } } : {}),
      ...(patch.reached ? { reached: { increment: patch.reached } } : {}),
      ...(patch.conversions ? { conversions: { increment: patch.conversions } } : {}),
    },
  });
}

export async function createSystemMessage(customerId: string, content: string) {
  await prisma.message.create({
    data: { customerId, type: "SYSTEM", content },
  });
}
