import { Link } from "react-router";
import { BarChart3, CalendarClock, Flame, History, Sparkles, Target } from "lucide-react";

import { useOperationalHeaderPresenter } from "./useOperationalHeaderPresenter";

export function OperationalHeader() {
  const presenter = useOperationalHeaderPresenter();
  const vm = presenter.model;

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
              <Sparkles size={11} />
              Centro operativo
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Ejecuta hoy sin perder el hilo
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              Este tablero esta sincronizado con el chat. Las acciones del asistente y las manuales
              impactan la misma cola de trabajo en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void presenter.reschedule()}
              disabled={!vm.canReschedule}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-3.5 py-2 text-[13px] font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarClock size={14} />
              Reprogramar
            </button>
            <Link
              to="/tasks/history"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3.5 py-2 text-[13px] font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px] hover:bg-[var(--hover-overlay-strong)]"
            >
              <History size={14} />
              Historial
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 md:p-6 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] font-medium">
              Cumplimiento
            </span>
            <Target size={15} style={{ color: "var(--violet-soft-text)" }} />
          </div>
          <div className="mt-2.5 flex items-end gap-1.5">
            <div className="text-3xl font-data font-bold tracking-tight text-[var(--foreground)]">
              {vm.completionRate}%
            </div>
            <div className="pb-1 text-xs text-[var(--muted)]">
              {vm.completed}/{vm.total}
            </div>
          </div>
          <div className="progress-bar mt-3">
            <div
              className="progress-bar-fill"
              style={{
                width: `${vm.completionRate}%`,
                background: "linear-gradient(90deg, var(--accent-secondary), var(--accent))",
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] font-medium">
              Presion
            </span>
            <Flame size={15} style={{ color: "var(--amber-soft-text)" }} />
          </div>
          <div className="mt-2.5 text-3xl font-data font-bold tracking-tight text-[var(--foreground)]">
            {vm.urgentCount}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
            {vm.urgentCount === 0
              ? "Sin tareas calientes."
              : `${vm.stuckCount} bloqueada${vm.stuckCount === 1 ? "" : "s"}, ${vm.highPriorityCount} alta prioridad.`}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] font-medium">
              Ritmo 7d
            </span>
            <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
          </div>
          <div className="mt-2.5 text-3xl font-data font-bold tracking-tight text-[var(--foreground)]">
            {vm.completionAverage}%
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
            {vm.pendingCount} pendiente{vm.pendingCount === 1 ? "" : "s"}, {vm.doneCount} cerrada
            {vm.doneCount === 1 ? "" : "s"}.
          </p>
        </div>
      </div>
    </div>
  );
}
