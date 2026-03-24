import { AlertTriangle, BarChart3, Sparkles } from "lucide-react";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import { useTasksData } from "../use-tasks-context";

export function NextBestAction() {
  const { topTask } = useTasksData();

  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Siguiente mejor accion
        </h3>
      </div>

      {topTask ? (
        <div className="mt-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            En foco
          </div>
          <div className="mt-2 text-base font-medium text-[var(--foreground)]">
            {topTask.title}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <TaskPriorityBadge priority={topTask.priority} />
            <TaskDomainBadge domain={topTask.domain} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            {topTask.status === "done"
              ? "La cola visible ya tiene trabajo cerrado."
              : topTask.carryOverCount > 0
                ? "Conviene resolverla o descartarla antes de sumar mas friccion."
                : "Es la pieza con mayor impacto inmediato segun prioridad y arrastre."}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">
          No hay tareas cargadas para hoy.
        </p>
      )}
    </div>
  );
}

export function RecoveryBoard() {
  const { review, pendingTasks, stuckTasks } = useTasksData();

  const pendingCount = review?.pending ?? pendingTasks.length;
  const carryOverCount = pendingTasks.filter((t) => t.carryOverCount > 0).length;
  const stuckCount = stuckTasks.length;

  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} style={{ color: "var(--amber-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Tablero de recuperacion
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-xs text-[var(--muted)]">Pendientes</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {pendingCount}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
          <div className="text-xs text-[var(--muted)]">Con carry-over</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {carryOverCount}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] p-4">
          <div className="text-xs text-[var(--muted)]">Bloqueadas</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {stuckCount}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeeklyRhythm() {
  const { trend, today } = useTasksData();

  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Ritmo semanal
        </h3>
      </div>

      {trend && trend.length > 0 ? (
        <div className="mt-5 flex gap-2">
          {trend.slice().reverse().map((day) => (
            <div key={day.date} className="flex-1 text-center">
              <div className="mb-2 flex h-24 items-end justify-center">
                <div
                  className="w-full max-w-[26px] rounded-t-xl"
                  style={{
                    height: `${Math.max(6, day.completionRate)}%`,
                    background:
                      day.date === today
                        ? "linear-gradient(to top, var(--accent-secondary), var(--accent))"
                        : "linear-gradient(to top, var(--violet-soft-bg), var(--violet-soft-border))",
                  }}
                />
              </div>
              <div className="text-[9px] text-[var(--muted)]">
                {day.date.slice(5)}
              </div>
              <div className="text-[10px] font-medium text-[var(--foreground)]">
                {day.completionRate}%
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Todavia no hay tendencia suficiente.
        </p>
      )}
    </div>
  );
}
