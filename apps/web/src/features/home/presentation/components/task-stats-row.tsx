import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  ListChecks,
  TrendingUp,
} from "lucide-react";

export interface TaskStatsRowProps {
  readonly tasksCompleted: number;
  readonly tasksTotal: number;
  readonly tasksPending: number;
  readonly tasksPct: number;
  readonly averageCompletion: number;
}

export function TaskStatsRow({
  tasksCompleted,
  tasksTotal,
  tasksPending,
  tasksPct,
  averageCompletion,
}: TaskStatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
      <Link
        href="/tasks"
        className="glass-card group cursor-pointer p-5 transition-all"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--violet-soft-bg)" }}
            >
              <ListChecks size={16} style={{ color: "var(--violet-soft-text)" }} />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">
              Tareas
            </span>
          </div>
          <ChevronRight
            size={14}
            className="text-[var(--muted)] transition-all group-hover:text-[var(--violet-soft-text)] group-hover:translate-x-0.5"
          />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {tasksCompleted}
          </span>
          <span className="text-sm text-[var(--muted)]">
            / {tasksTotal}
          </span>
        </div>
        <div className="progress-bar mt-3">
          <div
            className="progress-bar-fill"
            style={{ width: `${tasksPct}%`, background: "#8B5CF6" }}
          />
        </div>
      </Link>

      <div className="glass-card-static p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--amber-soft-bg)" }}
            >
              <AlertTriangle size={16} style={{ color: "var(--amber-soft-text)" }} />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">
              Pendientes
            </span>
          </div>
          <span className="badge-muted badge">Hoy</span>
        </div>
        <div className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {tasksPending}
        </div>
        <span className="mt-1.5 block text-xs text-[var(--muted)]">
          {tasksPending === 0 ? "Dia limpio" : "Quedan tareas abiertas"}
        </span>
      </div>

      <Link
        href="/tasks/history"
        className="glass-card group cursor-pointer p-5 transition-all"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--violet-soft-bg)" }}
            >
              <TrendingUp size={16} style={{ color: "var(--violet-soft-text)" }} />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">
              Promedio semanal
            </span>
          </div>
          <ChevronRight
            size={14}
            className="text-[var(--muted)] transition-all group-hover:text-[var(--violet-soft-text)] group-hover:translate-x-0.5"
          />
        </div>
        <div className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {averageCompletion}%
        </div>
        <span className="mt-1.5 block text-xs text-[var(--muted)]">
          Tasa media de completacion en 7 dias
        </span>
      </Link>
    </div>
  );
}
