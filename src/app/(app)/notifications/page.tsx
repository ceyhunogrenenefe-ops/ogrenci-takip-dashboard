"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale/tr";

type N = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<N[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.notifications || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bildirimler</h1>
        <button onClick={markRead} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold shadow-sm">
          Tümünü okundu işaretle
        </button>
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl p-4 shadow-sm ${n.read ? "bg-white" : "bg-sky-50 ring-1 ring-sky-100"}`}
          >
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm text-slate-600">{n.body}</p>
            <p className="mt-1 text-xs text-slate-400">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
