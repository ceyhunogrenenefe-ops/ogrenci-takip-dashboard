"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";

type Task = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  assignee: { name: string };
  customer: { id: string; name: string; phone?: string | null };
};

export default function CalendarPage() {
  const [view, setView] = useState<"day" | "week">("week");
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch(`/api/tasks?view=${view}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []));
  }, [view]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Takvim</h1>
          <p className="text-sm text-slate-500">Kim kimi ne zaman arayacak</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("day")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === "day" ? "bg-sky-600 text-white" : "bg-white"}`}
          >
            Günlük
          </button>
          <button
            onClick={() => setView("week")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === "week" ? "bg-sky-600 text-white" : "bg-white"}`}
          >
            Haftalık
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">
            Bu aralıkta görev yok.
          </p>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold">{t.title}</p>
              <p className="text-sm text-slate-500">
                {t.assignee.name} → {t.customer.name} {t.customer.phone ? `(${t.customer.phone})` : ""}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">
                {format(new Date(t.dueAt), "d MMMM HH:mm", { locale: tr })}
              </p>
              <p className="text-xs uppercase text-slate-400">{t.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
