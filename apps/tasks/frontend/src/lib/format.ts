import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: string | Date, fmt: string = "d MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
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

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

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
    health: "badge-green",
    work: "badge-amber",
    people: "badge-violet",
    study: "badge-muted",
  };
  return map[d] || "badge-muted";
}
