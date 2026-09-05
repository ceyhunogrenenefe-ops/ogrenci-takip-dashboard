export const STATUS_COLUMNS = [
  { key: "NEW", name: "Gelen Müşteriler", color: "#94a3b8" },
  { key: "CONTACTED", name: "İrtibata Geçildi", color: "#3b82f6" },
  { key: "THINKING", name: "Düşünme Aşamasında", color: "#eab308" },
  { key: "TRIAL", name: "Deneme Dersi", color: "#06b6d4" },
  { key: "WON", name: "Kayıt Oldu", color: "#22c55e" },
  { key: "LOST", name: "İptal / İlgisiz", color: "#64748b" },
] as const;

export const LEAD_SOURCES = [
  "INSTAGRAM",
  "WEB",
  "WHATSAPP",
  "FACEBOOK",
  "REFERRAL",
  "OTHER",
] as const;

export type StatusKey = (typeof STATUS_COLUMNS)[number]["key"];
export type LeadSource = (typeof LEAD_SOURCES)[number];
