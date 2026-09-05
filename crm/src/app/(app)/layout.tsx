import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/app-sidebar";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const unread = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <AppSidebar unread={unread} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
