/**
 * Pure view-model helpers for the Objectives card on /home (F1.4).
 *
 * Read-time objective progress is computed in `@/core/app/objectives/metric-sources`
 * and reused as-is — nothing here re-derives the value. These helpers only
 * format the "days remaining" label from `periodEnd` and build the pre-filled
 * `?capturar=` deep-link to the Tasks create surface (same pattern as Inbox
 * triage).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatDaysRemaining(periodEnd: string, todayISO: string): string {
  const end = new Date(`${periodEnd}T00:00:00`);
  const today = new Date(`${todayISO}T00:00:00`);
  const days = Math.round((end.getTime() - today.getTime()) / MS_PER_DAY);

  if (days < 0) return `Vencida hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Termina hoy";
  if (days === 1) return "Queda 1 día";
  return `Quedan ${days} días`;
}

export function objectiveCreateTaskHref(objectiveTitle: string): string {
  return `/tasks?capturar=${encodeURIComponent(`Avanzar en: ${objectiveTitle}`)}`;
}