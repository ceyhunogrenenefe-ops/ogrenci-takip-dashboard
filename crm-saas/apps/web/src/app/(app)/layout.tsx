"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { useEffect, useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.notifications) return;
        setUnread(d.notifications.filter((n: { read: boolean }) => !n.read).length);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <AppSidebar unread={unread} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
