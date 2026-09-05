"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/utils";

type Stat = {
  id: string;
  name: string;
  callsMade: number;
  contactsReached: number;
  activeConversations: number;
  conversions: number;
  periodConversions: number;
  revenue: number;
  messagesSent: number;
  conversionRate: number;
};

export default function DashboardPage() {
  const [range, setRange] = useState("week");
  const [stats, setStats] = useState<Stat[]>([]);
  const [totals, setTotals] = useState({ leads: 0, tasksDue: 0, unreadNotifications: 0 });

  useEffect(() => {
    fetch(`/api/dashboard?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats || []);
        setTotals(d.totals || { leads: 0, tasksDue: 0, unreadNotifications: 0 });
      });
  }, [range]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Satış Performansı</h1>
          <p className="text-sm text-slate-500">Temsilci bazlı dönüşüm ve aktivite</p>
        </div>
        <div className="flex gap-2">
          {[
            ["today", "Bugün"],
            ["week", "Haftalık"],
            ["month", "Aylık"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                range === k ? "bg-sky-600 text-white" : "bg-white text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Yeni lead</p>
          <p className="mt-2 text-3xl font-bold">{totals.leads}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Geciken görev</p>
          <p className="mt-2 text-3xl font-bold">{totals.tasksDue}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Bildirim</p>
          <p className="mt-2 text-3xl font-bold">{totals.unreadNotifications}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Temsilci</th>
              <th className="px-4 py-3">Arama</th>
              <th className="px-4 py-3">Ulaşılan</th>
              <th className="px-4 py-3">Aktif</th>
              <th className="px-4 py-3">Mesaj</th>
              <th className="px-4 py-3">Kayıt</th>
              <th className="px-4 py-3">Dönüşüm %</th>
              <th className="px-4 py-3">Ciro</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.callsMade}</td>
                <td className="px-4 py-3">{s.contactsReached}</td>
                <td className="px-4 py-3">{s.activeConversations}</td>
                <td className="px-4 py-3">{s.messagesSent}</td>
                <td className="px-4 py-3">{s.periodConversions}</td>
                <td className="px-4 py-3">{s.conversionRate}%</td>
                <td className="px-4 py-3">{formatMoney(s.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
