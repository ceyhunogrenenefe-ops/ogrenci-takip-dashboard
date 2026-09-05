import { PrismaClient, Role, Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STATUSES: Status[] = ["NEW", "CONTACTED", "THINKING", "TRIAL", "WON", "LOST"];
const FIRST = ["Ayşe", "Mehmet", "Elif", "Can", "Zeynep", "Emre", "Defne", "Burak", "Selin", "Kerem"];
const LAST = ["Yılmaz", "Demir", "Kaya", "Çelik", "Şahin", "Aydın", "Öztürk", "Arslan", "Doğan", "Koç"];
const CLASSES = ["5", "6", "7", "8", "9", "10", "11", "12"];
const SOURCES = ["INSTAGRAM", "WEB", "WHATSAPP", "FACEBOOK", "REFERRAL"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function phone() {
  const n = Math.floor(1000000 + Math.random() * 8999999);
  return `+90 5${Math.floor(10 + Math.random() * 89)} ${String(n).slice(0, 3)} ${String(n).slice(3, 5)} ${String(n).slice(5)}`;
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.task.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: { name: "Online VIP Dershane" },
  });

  const password = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Ceyhun Yönetici",
      email: "admin@onlinevipdershane.com",
      password,
      role: Role.SUPER_ADMIN,
      stats: { create: { totalCalls: 0, reached: 0, conversions: 0 } },
    },
  });

  const reps = await Promise.all(
    ["Ayşe Satış", "Mehmet Arama", "Elif Temsilci"].map((name, i) =>
      prisma.user.create({
        data: {
          companyId: company.id,
          name,
          email: `satis${i + 1}@onlinevipdershane.com`,
          password,
          role: Role.SALES,
          stats: {
            create: {
              totalCalls: 20 + i * 12,
              reached: 15 + i * 8,
              conversions: 2 + i,
            },
          },
        },
      })
    )
  );

  for (let i = 0; i < 48; i++) {
    const status = STATUSES[i % STATUSES.length];
    const rep = pick(reps);
    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: `${pick(FIRST)} ${pick(LAST)}`,
        phone: phone(),
        status,
        source: pick(SOURCES),
        className: pick(CLASSES),
        notes: i % 3 === 0 ? "Veli bilgilendirildi." : null,
        assignedToId: rep.id,
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
          content: "Merhaba, deneme dersi için müsait misiniz?",
        },
      });
    }

    if (i % 4 === 0) {
      await prisma.task.create({
        data: {
          customerId: customer.id,
          userId: rep.id,
          title: i % 8 === 0 ? "14:30 ara" : "Yarın takip et",
          dueDate: new Date(Date.now() + (i % 5) * 86400_000 + 2 * 3600_000),
        },
      });
    }
  }

  console.log("Seed OK");
  console.log("Admin:", admin.email, "/ demo1234");
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
