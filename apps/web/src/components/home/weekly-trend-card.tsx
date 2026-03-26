import { TrendingUp } from "lucide-react";
import type { TaskTrendDay } from "@/lib/api/types";

export interface WeeklyTrendCardProps {
  readonly trend: readonly TaskTrendDay[] | undefined;
}

export function WeeklyTrendCard({ trend }: WeeklyTrendCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Tendencia semanal
          </h3>
        </div>
        <span className="text-xs text-[var(--muted)]">Ultimos 7 dias</span>
      </div>
      <div className="space-y-3 p-4">
        {trend && trend.length > 0 ? (
          trend.map((day) => (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-16 text-xs text-[var(--muted)]">
                {day.date.slice(5)}
              </div>
              <div className="flex-1">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.max(day.completionRate, 4)}%`,
                      background:
                        "linear-gradient(to right, var(--accent), var(--accent-secondary))",
                    }}
                  />
                </div>
              </div>
              <div className="w-12 text-right text-xs font-medium text-[var(--foreground)]">
                {day.completionRate}%
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[var(--muted)]">
            Todavia no hay tendencia para mostrar.
          </div>
        )}
      </div>
    </div>
  );
}
