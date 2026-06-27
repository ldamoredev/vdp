import { Clock3 } from "lucide-react";

import type { TodayProjectHoursViewModel } from "@/ui/models/projects/TodayProjectHoursViewModel";

export function DailyReviewProjectHours({ projectHours }: { projectHours: TodayProjectHoursViewModel }) {
  return (
    <section className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <Clock3 size={16} style={{ color: "var(--violet-soft-text)" }} />
            {projectHours.title}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{projectHours.summary}</p>
        </div>
        <div className="text-3xl font-data font-bold text-[var(--foreground)]">
          {projectHours.totalLabel}
        </div>
      </div>

      {projectHours.hasEntries ? (
        <div className="mt-4 space-y-2">
          {projectHours.rows.map((row) => (
            <div
              key={row.projectId}
              className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--foreground)]">
                  {row.projectOutcome}
                </div>
                {row.clientLabel ? (
                  <div className="truncate text-xs text-[var(--muted)]">{row.clientLabel}</div>
                ) : null}
              </div>
              <span className="shrink-0 font-data text-sm font-semibold text-[var(--foreground)]">
                {row.durationLabel}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-sm text-[var(--muted)]">
          {projectHours.emptyLabel}
        </p>
      )}
    </section>
  );
}
