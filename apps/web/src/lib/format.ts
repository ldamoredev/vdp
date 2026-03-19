import { CURRENCIES } from "@vdp/shared";
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ─── Wallet ──────────────────────────────────────────────

export function formatMoney(amount: string | number, currency: "ARS" | "USD") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const curr = CURRENCIES[currency];
  return `${curr.symbol} ${num.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Dates ───────────────────────────────────────────────

export function formatDate(date: string | Date, fmt: string = "d MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function formatDateShort(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Manana";
  if (isYesterday(d)) return "Ayer";
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function formatDayOfWeek(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE", { locale: es });
}

/** Returns today's date as YYYY-MM-DD in the user's local timezone. */
export function getTodayISO(): string {
  return localDateISO(new Date());
}

/** Returns tomorrow's date as YYYY-MM-DD in the user's local timezone. */
export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDateISO(d);
}

/** Formats a Date as YYYY-MM-DD using local timezone (not UTC). */
function localDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Tasks ───────────────────────────────────────────────

export function priorityLabel(p: number): string {
  return p === 3 ? "Alta" : p === 2 ? "Media" : "Baja";
}

export function priorityBadge(p: number): string {
  return p === 3 ? "badge-red" : p === 2 ? "badge-amber" : "badge-muted";
}

export function domainLabel(d: string | null): string {
  if (!d) return "";
  const map: Record<string, string> = {
    wallet: "Finanzas",
    health: "Salud",
    work: "Trabajo",
    people: "Gente",
    study: "Estudio",
  };
  return map[d] || d;
}

export function domainBadge(d: string | null): string {
  if (!d) return "";
  const map: Record<string, string> = {
    wallet: "badge-blue",
    health: "badge-emerald",
    work: "badge-amber",
    people: "badge-violet",
    study: "badge-muted",
  };
  return map[d] || "badge-muted";
}

// ─── Health ─────────────────────────────────────────────

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy, HH:mm", { locale: es });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: es });
}

export function formatMetricValue(value: number | string, unit: string): string {
  const v = typeof value === "string" ? parseFloat(value) : value;
  switch (unit) {
    case "hours": {
      const h = Math.floor(v);
      const m = Math.round((v - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    case "steps":
      return v.toLocaleString("es-AR");
    case "ml":
      return v >= 1000 ? `${(v / 1000).toFixed(1)} L` : `${v} ml`;
    case "kcal":
      return v.toLocaleString("es-AR");
    case "kg":
      return `${v.toFixed(1)} kg`;
    case "bpm":
      return `${Math.round(v)} bpm`;
    case "%":
      return `${v.toFixed(1)}%`;
    case "mmHg":
      return `${Math.round(v)} mmHg`;
    case "mg/dL":
      return `${Math.round(v)} mg/dL`;
    case "cm":
      return `${v.toFixed(1)} cm`;
    case "scale":
      return `${Math.round(v)}/5`;
    default:
      return `${v} ${unit}`;
  }
}
