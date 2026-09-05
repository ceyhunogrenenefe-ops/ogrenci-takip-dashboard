"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { X, Send, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  customerId: string;
  users: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  onClose: () => void;
  onChanged: () => void;
};

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  grade?: string | null;
  notes?: string | null;
  source: string;
  tags: string[];
  stageId: string;
  assignedUserId?: string | null;
  stage?: { name: string };
  assignedUser?: { id: string; name: string } | null;
  messages: Array<{
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender?: { name: string } | null;
  }>;
  activities: Array<{
    id: string;
    summary: string;
    createdAt: string;
    user?: { name: string } | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    dueAt: string;
    status: string;
  }>;
};

export function CustomerDetailPanel({
  customerId,
  users,
  stages,
  onClose,
  onChanged,
}: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState("");
  const [sendWa, setSendWa] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/customers/${customerId}`);
    const data = await res.json();
    setCustomer(data.customer);
  }

  useEffect(() => {
    load();
    const t = setInterval(async () => {
      if (!customer?.messages?.length) return;
      const since = customer.messages[customer.messages.length - 1]?.createdAt;
      const res = await fetch(
        `/api/customers/${customerId}/messages?since=${encodeURIComponent(since)}`
      );
      const data = await res.json();
      if (data.messages?.length) {
        setCustomer((c) =>
          c
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  ...data.messages.filter(
                    (m: { id: string }) => !c.messages.some((x) => x.id === m.id)
                  ),
                ],
              }
            : c
        );
      }
    }, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [customer?.messages?.length]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.customer) setCustomer(data.customer);
    onChanged();
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    const res = await fetch(`/api/customers/${customerId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, sendWhatsApp: sendWa }),
    });
    const data = await res.json();
    if (data.message) {
      setCustomer((c) =>
        c ? { ...c, messages: [...c.messages, data.message] } : c
      );
      setMessage("");
    }
  }

  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTitle || !taskDue) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        title: taskTitle,
        dueAt: taskDue,
      }),
    });
    setTaskTitle("");
    setTaskDue("");
    load();
  }

  if (!customer) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
        <div className="h-full w-full max-w-5xl bg-white p-6">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-5xl bg-white shadow-2xl">
        {/* Left: fields */}
        <div className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 p-4">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400">Müşteri #{customer.id.slice(-8)}</p>
              <h2 className="text-lg font-bold">{customer.name}</h2>
              <p className="text-xs text-sky-600">{customer.stage?.name}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="mb-3 block text-xs font-semibold text-slate-500">
            Ad
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
              defaultValue={customer.name}
              onBlur={(e) => {
                if (e.target.value !== customer.name) patch({ name: e.target.value });
              }}
            />
          </label>
          <label className="mb-3 block text-xs font-semibold text-slate-500">
            Telefon
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
              defaultValue={customer.phone || ""}
              onBlur={(e) => patch({ phone: e.target.value })}
            />
          </label>
          <label className="mb-3 block text-xs font-semibold text-slate-500">
            Sınıf
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
              defaultValue={customer.grade || ""}
              onBlur={(e) => patch({ grade: e.target.value })}
            />
          </label>
          <label className="mb-3 block text-xs font-semibold text-slate-500">
            Aşama
            <select
              className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
              value={customer.stageId}
              onChange={(e) => patch({ stageId: e.target.value })}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mb-3 block text-xs font-semibold text-slate-500">
            Temsilci
            <select
              className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
              value={customer.assignedUserId || ""}
              onChange={(e) => patch({ assignedUserId: e.target.value || null })}
            >
              <option value="">Atanmadı</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mb-3 block text-xs font-semibold text-slate-500">
            Notlar
            <textarea
              className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
              rows={4}
              defaultValue={customer.notes || ""}
              onBlur={(e) => patch({ notes: e.target.value })}
            />
          </label>

          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500">Etiketler</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {customer.tags.map((t) => (
                <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-[11px]">
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => patch({ status: "TRIAL" })}
              className="mt-2 text-xs font-semibold text-sky-600"
            >
              + Deneme Dersi aşamasına taşı
            </button>
          </div>

          <form onSubmit={addTask} className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Görev / Hatırlatma</p>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="14:30 ara"
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
            />
            <input
              type="datetime-local"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
            />
            <button className="mt-2 w-full rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white">
              Görev ekle
            </button>
            <ul className="mt-3 space-y-1">
              {customer.tasks.map((t) => (
                <li key={t.id} className="text-[11px] text-slate-600">
                  {t.title} · {format(new Date(t.dueAt), "d MMM HH:mm", { locale: tr })}
                </li>
              ))}
            </ul>
          </form>
        </div>

        {/* Center: chat + timeline */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold">Sohbet & Aktivite</p>
            <p className="text-xs text-slate-500">
              Kaynak: {customer.source} · {customer.assignedUser?.name || "Atanmadı"}
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {customer.activities
              .slice()
              .reverse()
              .map((a) => (
                <div key={a.id} className="text-center text-[11px] text-slate-400">
                  {a.summary} ·{" "}
                  {format(new Date(a.createdAt), "d MMM HH:mm", { locale: tr })}
                </div>
              ))}
            {customer.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  m.type === "SYSTEM"
                    ? "mx-auto bg-transparent text-center text-xs text-slate-400"
                    : m.sender
                      ? "ml-auto bg-sky-600 text-white"
                      : "bg-white text-slate-800 shadow-sm"
                )}
              >
                {m.type !== "SYSTEM" && m.sender && (
                  <p className="mb-0.5 text-[10px] opacity-80">{m.sender.name}</p>
                )}
                {m.content}
                <p className="mt-1 text-[10px] opacity-70">
                  {format(new Date(m.createdAt), "HH:mm")}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={sendWa}
                  onChange={(e) => setSendWa(e.target.checked)}
                />
                WhatsApp ile de gönder
              </label>
              {customer.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Sohbet mesajını buraya yazın..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              />
              <button className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                <Send className="h-4 w-4" />
                Gönder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
