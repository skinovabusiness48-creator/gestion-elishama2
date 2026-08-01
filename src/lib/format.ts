// ============================================================
// ELISHAMA — Utilitaires de formatage
// ============================================================

export function formatCurrency(amount: number, currency = "FCFA"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${currency}`;
}

export function formatNumber(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date, format = "DD/MM/YYYY"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "DD/MM/YYYY HH:mm":
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "HH:mm":
      return `${hours}:${minutes}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "DD/MM/YYYY HH:mm");
}

export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function isSameDay(date: string | Date, ref = new Date()): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function isThisWeek(date: string | Date, ref = new Date()): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const start = new Date(ref);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // lundi
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

export function isThisMonth(date: string | Date, ref = new Date()): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function isThisYear(date: string | Date, ref = new Date()): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getFullYear() === ref.getFullYear();
}

export function genId(prefix = ""): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${prefix ? "_" : ""}${ts}${rand}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
