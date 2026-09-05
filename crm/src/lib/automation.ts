import { prisma } from "./prisma";

export async function logActivity(opts: {
  customerId: string;
  userId?: string | null;
  type: string;
  summary: string;
}) {
  await prisma.activity.create({
    data: {
      customerId: opts.customerId,
      userId: opts.userId || null,
      type: opts.type,
      summary: opts.summary,
    },
  });
  await prisma.customer.update({
    where: { id: opts.customerId },
    data: { lastActivityAt: new Date() },
  });
}

export async function createSystemMessage(customerId: string, content: string) {
  await prisma.message.create({
    data: {
      customerId,
      type: "SYSTEM",
      content,
    },
  });
}

/** Simple rule engine used by stage moves / booking actions */
export async function runAutomations(opts: {
  companyId: string;
  customerId: string;
  triggerType: string;
  triggerValue?: string;
}) {
  const rules = await prisma.automation.findMany({
    where: {
      companyId: opts.companyId,
      enabled: true,
      triggerType: opts.triggerType,
    },
  });

  for (const rule of rules) {
    if (rule.triggerValue && rule.triggerValue !== opts.triggerValue) continue;

    if (rule.actionType === "MOVE_STAGE" && rule.actionValue) {
      const stage = await prisma.pipelineStage.findFirst({
        where: { companyId: opts.companyId, slug: rule.actionValue },
      });
      if (!stage) continue;
      await prisma.customer.update({
        where: { id: opts.customerId },
        data: { stageId: stage.id, lastActivityAt: new Date() },
      });
      await createSystemMessage(
        opts.customerId,
        `Otomasyon: aşama "${stage.name}" olarak güncellendi`
      );
      await logActivity({
        customerId: opts.customerId,
        type: "automation",
        summary: `Otomasyon tetiklendi → ${stage.name}`,
      });
    }

    if (rule.actionType === "ASSIGN_ROUND_ROBIN") {
      const reps = await prisma.user.findMany({
        where: { companyId: opts.companyId, role: "SALES_REP", active: true },
        orderBy: { assignedCustomers: { _count: "asc" } },
        take: 1,
      });
      const rep = reps[0];
      if (!rep) continue;
      await prisma.customer.update({
        where: { id: opts.customerId },
        data: { assignedUserId: rep.id },
      });
      await createSystemMessage(
        opts.customerId,
        `Otomasyon: ${rep.name} temsilciye atandı`
      );
      await prisma.notification.create({
        data: {
          companyId: opts.companyId,
          userId: rep.id,
          title: "Yeni lead atandı",
          body: "Otomatik atama ile yeni müşteri size verildi.",
        },
      });
    }
  }
}
