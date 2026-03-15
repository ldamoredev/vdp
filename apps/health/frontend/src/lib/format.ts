import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: string | Date, fmt: string = "d MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy, HH:mm", { locale: es });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: es });
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

export function formatMetricValue(value: number | string, unit: string): string {
  const v = typeof value === "string" ? parseFloat(value) : value;
  switch (unit) {
    case "hours":
      const h = Math.floor(v);
      const m = Math.round((v - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
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

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}
