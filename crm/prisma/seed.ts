import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { LeadSource, Role } from "../src/lib/types";

const prisma = new PrismaClient();

const STAGES = [
  { name: "Gelen Müşteriler", slug: "gelen-musteriler", color: "#94a3b8", position: 0 },
  { name: "İrtibata Geçildi", slug: "irtibata-gecildi", color: "#3b82f6", position: 1 },
  { name: "Düşünme Aşamasında", slug: "dusunme", color: "#eab308", position: 2 },
  { name: "Deneme Dersi", slug: "deneme-dersi", color: "#06b6d4", position: 3 },
  { name: "Kayıt Oldu", slug: "kayit-oldu", color: "#22c55e", position: 4 },
  { name: "İptal / İlgisiz", slug: "iptal", color: "#64748b", position: 5 },
];

const FIRST = ["Ayşe", "Mehmet", "Elif", "Can", "Zeynep", "Emre", "Defne", "Burak", "Selin", "Kerem"];
const LAST = ["Yılmaz", "Demir", "Kaya", "Çelik", "Şahin", "Aydın", "Öztürk", "Arslan", "Doğan", "Koç"];
const GRADES = ["5", "6", "7", "8", "9", "10", "11", "12"];
const SOURCES: LeadSource[] = ["INSTAGRAM", "WEB", "WHATSAPP", "FACEBOOK", "REFERRAL"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function phone() {
  const n = Math.floor(1000000 + Math.random() * 8999999);
  return `+90 5${Math.floor(10 + Math.random() * 89)} ${String(n).slice(0, 3)} ${String(n).slice(3, 5)} ${String(n).slice(5)}`;
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: "Online VIP Dershane",
      slug: "online-vip",
      plan: "ADVANCED",
      leadLimit: 5000,
    },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Ceyhun Yönetici",
      email: "admin@onlinevipdershane.com",
      passwordHash,
      role: "SUPER_ADMIN" as Role,
    },
  });

  const reps = await Promise.all(
    ["Ayşe Satış", "Mehmet Arama", "Elif Temsilci"].map((name, i) =>
      prisma.user.create({
        data: {
          companyId: company.id,
          name,
          email: `satis${i + 1}@onlinevipdershane.com`,
          passwordHash,
          role: "SALES_REP",
          callsMade: 20 + i * 12,
          contactsReached: 15 + i * 8,
          conversions: 2 + i,
        },
      })
    )
  );

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Koç Deniz",
      email: "koc@onlinevipdershane.com",
      passwordHash,
      role: "COACH",
    },
  });

  const stages = [];
  for (const s of STAGES) {
    stages.push(
      await prisma.pipelineStage.create({
        data: { companyId: company.id, ...s },
      })
    );
  }

  await prisma.automation.createMany({
    data: [
      {
        companyId: company.id,
        name: "Yeni lead round-robin",
        triggerType: "LEAD_CREATED",
        actionType: "ASSIGN_ROUND_ROBIN",
        enabled: true,
      },
      {
        companyId: company.id,
        name: "Deneme rezervasyonu → Deneme Dersi",
        triggerType: "TAG_ADDED",
        triggerValue: "deneme-booked",
        actionType: "MOVE_STAGE",
        actionValue: "deneme-dersi",
        enabled: true,
      },
    ],
  });

  const allReps = reps;
  for (let i = 0; i < 48; i++) {
    const stage = stages[i % stages.length];
    const rep = pick(allReps);
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        stageId: stage.id,
        assignedUserId: rep.id,
        name,
        phone: phone(),
        grade: pick(GRADES),
        source: pick(SOURCES),
        notes: i % 3 === 0 ? "Veli bilgilendirildi, paket anlatıldı." : null,
        tags: JSON.stringify(i % 5 === 0 ? ["START PAKET"] : i % 7 === 0 ? ["ÖZEL DERS"] : []),
        revenue: stage.slug === "kayit-oldu" ? pick([4500, 6500, 9000]) : 0,
        lastActivityAt: new Date(Date.now() - i * 3600_000),
      },
    });

    await prisma.activity.create({
      data: {
        customerId: customer.id,
        userId: rep.id,
        type: "created",
        summary: "Lead oluşturuldu",
      },
    });

    await prisma.message.create({
      data: {
        customerId: customer.id,
        type: "SYSTEM",
        content: "Konuşma başlatıldı",
      },
    });

    if (i % 2 === 0) {
      await prisma.message.create({
        data: {
          customerId: customer.id,
          senderId: rep.id,
          type: "TEXT",
          content: "Merhaba, Online VIP Dershane'den ulaşıyorum. Deneme dersi için müsait misiniz?",
        },
      });
    }

    if (i % 4 === 0) {
      await prisma.task.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          assigneeId: rep.id,
          title: i % 8 === 0 ? "14:30 ara" : "Yarın takip et",
          dueAt: new Date(Date.now() + (i % 5) * 86400_000 + 2 * 3600_000),
          status: "PENDING",
        },
      });
    }
  }

  await prisma.notification.create({
    data: {
      companyId: company.id,
      userId: admin.id,
      title: "CRM hazır",
      body: "Demo veriler yüklendi. Pipeline ekranından başlayabilirsiniz.",
    },
  });

  console.log("Seed OK");
  console.log("Login: admin@onlinevipdershane.com / demo1234");
  console.log("Sales: satis1@onlinevipdershane.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
