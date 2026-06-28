import { formatMinutes, type ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import type {
  TodayProjectHoursRowViewModel,
  TodayProjectHoursViewModel,
} from "@/ui/models/projects/TodayProjectHoursViewModel";

const MAX_PROJECT_ROWS = 3;

export function buildTodayProjectHoursVM(report: ProjectHoursReport | null): TodayProjectHoursViewModel {
  const byProject = new Map<string, TodayProjectHoursRowViewModel>();

  for (const row of report?.rows ?? []) {
    const existing = byProject.get(row.projectId);
    byProject.set(row.projectId, {
      projectId: row.projectId,
      projectOutcome: row.projectOutcome,
      clientLabel: row.clientName,
      minutes: (existing?.minutes ?? 0) + row.minutes,
      durationLabel: formatMinutes((existing?.minutes ?? 0) + row.minutes),
    });
  }

  const allRows = Array.from(byProject.values())
    .sort((left, right) => right.minutes - left.minutes);
  const totalMinutes = allRows.reduce((sum, row) => sum + row.minutes, 0);
  const totalLabel = formatMinutes(totalMinutes);
  const topProject = allRows[0]?.projectOutcome;

  return {
    title: "Tiempo de proyectos hoy",
    summary: allRows.length === 0
      ? "Todavía no cargaste horas de proyecto para hoy."
      : allRows.length === 1
        ? `Hoy dedicaste ${totalLabel} a ${topProject}.`
        : `Hoy dedicaste ${totalLabel} a ${allRows.length} proyectos.`,
    totalLabel,
    emptyLabel: "Sin horas registradas hoy.",
    hasEntries: totalMinutes > 0,
    rows: allRows.slice(0, MAX_PROJECT_ROWS),
  };
}
