"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarDays,
  Users,
  Bell,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/pipeline", icon: KanbanSquare, label: "Pipeline" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Performans" },
  { href: "/calendar", icon: CalendarDays, label: "Takvim" },
  { href: "/notifications", icon: Bell, label: "Bildirimler" },
  { href: "/team", icon: Users, label: "Ekip" },
];

export function AppSidebar({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-slate-200 bg-slate-950 py-4 text-slate-200">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white">
        OV
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-xl transition",
                active ? "bg-sky-500 text-white" : "hover:bg-slate-800"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.href === "/notifications" && unread > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        title="Çıkış"
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-800"
      >
        <LogOut className="h-5 w-5" />
      </button>
      <Link
        href="/dashboard"
        className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-800"
        title="Ayarlar"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </aside>
  );
}
