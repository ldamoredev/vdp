import { ArrowRight, CheckCircle2, Trash2 } from "lucide-react";

export interface DailyReviewTaskItem {
  id: string;
  title: string;
  detail: string;
  carryOverCount?: number;
}

interface DailyReviewTaskQueueProps {
  tasks: DailyReviewTaskItem[];
  onComplete?: (taskId: string) => void;
  onCarryOver?: (taskId: string) => void;
  onDiscard?: (taskId: string) => void;
  isTaskBusy?: (taskId: string) => boolean;
}

export function DailyReviewTaskQueue({
  tasks,
  onComplete,
  onCarryOver,
  onDiscard,
  isTaskBusy,
}: DailyReviewTaskQueueProps) {
  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Cerrar tareas
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Cada pendiente merece una decisión simple: terminar, mover o soltar.
        </p>
      </div>

      <div className="space-y-3 p-5">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] p-4 text-sm text-[var(--foreground)]">
            No quedan tareas por resolver en el cierre de hoy.
          </div>
        ) : (
          tasks.map((task) => {
            const busy = isTaskBusy?.(task.id) ?? false;

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {task.title}
                      </span>
                      {(task.carryOverCount ?? 0) > 0 ? (
                        <span className="rounded-full border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-2 py-1 text-[10px] font-medium text-[var(--amber-soft-text)]">
                          {task.carryOverCount}x carry-over
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                      {task.detail}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onComplete?.(task.id)}
                      disabled={busy || !onComplete}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--emerald-soft-text)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      Completar
                    </button>
                    <button
                      type="button"
                      onClick={() => onCarryOver?.(task.id)}
                      disabled={busy || !onCarryOver}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--amber-soft-text)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowRight size={13} />
                      Llevar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDiscard?.(task.id)}
                      disabled={busy || !onDiscard}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--red-soft-text)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Descartar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
