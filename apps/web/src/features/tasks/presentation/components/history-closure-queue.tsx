import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  Check,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StateCard } from "@/components/primitives/state-card";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import { useHistoryData, useHistoryActions } from "../use-history-context";

export function HistoryClosureQueue() {
  const { pendingTasks, nextReviewDate, isCarryingOverAll } = useHistoryData();
  const { carryOverAll, carryOverTask, discardTask, isTaskBusy } =
    useHistoryActions();

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--glass-border)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Cola de cierre
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cada tarea pendiente necesita una decision: moverla o cerrarla.
            </p>
          </div>

          <button
            type="button"
            onClick={carryOverAll}
            disabled={pendingTasks.length === 0 || isCarryingOverAll}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-4 py-2 text-sm font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarRange size={15} />
            Mover todo a {format(nextReviewDate, "EEE d MMM", { locale: es })}
          </button>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {pendingTasks.length === 0 && (
          <StateCard
            tone="soft"
            size="lg"
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--emerald-soft-bg)]">
                <Check
                  size={24}
                  style={{ color: "var(--emerald-soft-text)" }}
                />
              </div>
            }
            title="No quedan tareas abiertas para este dia."
            description="El review ya esta resuelto. Solo queda observar el patron y seguir con el siguiente bloque."
          />
        )}

        {pendingTasks.map((task) => {
          const busy = isTaskBusy(task.id);
          return (
            <div
              key={task.id}
              className="rounded-[28px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {task.title}
                    </span>
                    {task.carryOverCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-2 py-1 text-[10px] font-medium text-[var(--amber-soft-text)]">
                        <AlertTriangle size={10} />
                        {task.carryOverCount}x
                      </span>
                    )}
                    {task.carryOverCount >= 3 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-2 py-1 text-[10px] font-medium text-[var(--red-soft-text)]">
                        Bloqueada
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <TaskPriorityBadge priority={task.priority} />
                    <TaskDomainBadge domain={task.domain} />
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                    {task.carryOverCount >= 3
                      ? "Ya arrastra demasiada deuda. Si sigue viva, debe pasar al siguiente dia con intencion explicita."
                      : "Todavia esta abierta al final del dia. Decide ahora si merece continuar o si debe salir de la cola."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => carryOverTask(task.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-3 py-2 text-xs font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowRight size={13} />
                    Llevar a {format(nextReviewDate, "EEE d MMM", { locale: es })}
                  </button>
                  <button
                    type="button"
                    onClick={() => discardTask(task.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--red-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    Cerrar sin arrastrar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
