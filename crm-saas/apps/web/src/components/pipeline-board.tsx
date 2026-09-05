"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { Plus, Search, Zap } from "lucide-react";
import { cn, formatMoney, formatPhone, parseTags } from "@/lib/utils";
import { CustomerDetailPanel } from "@/components/customer-detail-panel";

type UserOpt = { id: string; name: string; role: string };
type Card = {
  id: string;
  name: string;
  phone?: string | null;
  grade?: string | null;
  source: string;
  tags: string;
  revenue: number;
  lastActivityAt: string;
  assignedUser?: { id: string; name: string } | null;
};
type Stage = {
  id: string;
  name: string;
  slug: string;
  color: string;
  count: number;
  revenue: number;
  customers: Card[];
};

function LeadCard({
  card,
  onOpen,
  dragging,
}: {
  card: Card;
  onOpen: (id: string) => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { type: "card", card },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  const tags = parseTags(card.tags);

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(card.id)}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-sky-300 hover:shadow",
        dragging && "shadow-lg ring-2 ring-sky-400"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {card.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{card.name}</p>
          <p className="truncate text-xs text-slate-500">{formatPhone(card.phone)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {card.source}
            </span>
            {card.grade && (
              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                {card.grade}. sınıf
              </span>
            )}
            {tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>{card.assignedUser?.name || "Atanmadı"}</span>
            <span>
              {formatDistanceToNow(new Date(card.lastActivityAt), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function StageColumn({
  stage,
  onOpen,
}: {
  stage: Stage;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { type: "stage" } });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-2xl bg-slate-50/80",
        isOver && "ring-2 ring-sky-300"
      )}
    >
      <div className="border-b-4 px-3 pb-3 pt-3" style={{ borderBottomColor: stage.color }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            {stage.name}
          </h3>
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm">
            {stage.count}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {stage.count} müşteri · {formatMoney(stage.revenue)}
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {stage.customers.map((c) => (
          <LeadCard key={c.id} card={c} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [filters, setFilters] = useState({
    q: "",
    grade: "",
    source: "",
    assignedUserId: "",
    from: "",
    to: "",
  });
  const [showNew, setShowNew] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const res = await fetch(`/api/pipeline?${params.toString()}`);
    const data = await res.json();
    setStages(data.stages || []);
    setUsers(data.users || []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const totals = useMemo(() => {
    const count = stages.reduce((s, x) => s + x.count, 0);
    const revenue = stages.reduce((s, x) => s + x.revenue, 0);
    return { count, revenue };
  }, [stages]);

  async function onDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const cardId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    const fromStage = stages.find((s) => s.customers.some((c) => c.id === cardId));
    const toStage =
      stages.find((s) => s.id === overId) ||
      stages.find((s) => s.customers.some((c) => c.id === overId));
    if (!fromStage || !toStage || fromStage.id === toStage.id) return;

    const card = fromStage.customers.find((c) => c.id === cardId);
    if (!card) return;

    setStages((prev) =>
      prev.map((s) => {
        if (s.id === fromStage.id) {
          return {
            ...s,
            customers: s.customers.filter((c) => c.id !== cardId),
            count: s.count - 1,
            revenue: s.revenue - card.revenue,
          };
        }
        if (s.id === toStage.id) {
          return {
            ...s,
            customers: [card, ...s.customers],
            count: s.count + 1,
            revenue: s.revenue + card.revenue,
          };
        }
        return s;
      })
    );

    await fetch(`/api/customers/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStage.id }),
    });
    load();
  }

  async function createCustomer(fd: FormData) {
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        grade: fd.get("grade"),
        source: fd.get("source") || "WEB",
      }),
    });
    setShowNew(false);
    load();
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Pipeline
          </p>
          <h1 className="text-lg font-bold text-slate-900">Satış Hunisi</h1>
        </div>

        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Arama ve filtreleme"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={filters.grade}
          onChange={(e) => setFilters((f) => ({ ...f, grade: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
        >
          <option value="">Sınıf</option>
          {["5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
            <option key={g} value={g}>
              {g}. sınıf
            </option>
          ))}
        </select>

        <select
          value={filters.source}
          onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
        >
          <option value="">Kaynak</option>
          {["INSTAGRAM", "WEB", "WHATSAPP", "FACEBOOK", "REFERRAL"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filters.assignedUserId}
          onChange={(e) => setFilters((f) => ({ ...f, assignedUserId: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
        >
          <option value="">Temsilci</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />

        <div className="text-sm font-medium text-slate-600">
          {totals.count} müşteri · {formatMoney(totals.revenue)}
        </div>

        <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          <Zap className="h-4 w-4 text-amber-500" />
          Otomatikleştir
        </button>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri
        </button>
      </header>

      <div className="flex-1 overflow-x-auto p-4">
        {loading ? (
          <p className="text-sm text-slate-500">Yükleniyor...</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(e) => {
              const card = stages
                .flatMap((s) => s.customers)
                .find((c) => c.id === e.active.id);
              setActiveCard(card || null);
            }}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveCard(null)}
          >
            <div className="flex h-full min-h-[70vh] gap-3">
              {stages.map((stage) => (
                <StageColumn key={stage.id} stage={stage} onOpen={setSelectedId} />
              ))}
            </div>
            <DragOverlay>
              {activeCard ? <LeadCard card={activeCard} onOpen={() => {}} dragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {selectedId && (
        <CustomerDetailPanel
          customerId={selectedId}
          users={users}
          stages={stages.map((s) => ({ id: s.id, name: s.name }))}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              createCustomer(new FormData(e.currentTarget));
            }}
          >
            <h2 className="text-lg font-bold">Yeni müşteri</h2>
            <div className="mt-4 space-y-3">
              <input name="name" required placeholder="Ad Soyad" className="w-full rounded-lg border px-3 py-2" />
              <input name="phone" placeholder="Telefon" className="w-full rounded-lg border px-3 py-2" />
              <input name="grade" placeholder="Sınıf" className="w-full rounded-lg border px-3 py-2" />
              <select name="source" className="w-full rounded-lg border px-3 py-2">
                <option value="WEB">WEB</option>
                <option value="INSTAGRAM">INSTAGRAM</option>
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="FACEBOOK">FACEBOOK</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="rounded-lg px-3 py-2 text-sm">
                İptal
              </button>
              <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white">
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
