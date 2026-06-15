import type { FormEvent } from "react";
import { Link } from "react-router";
import { Check, CheckCircle2, ListChecks, Plus } from "lucide-react";
import { CollectionCard } from "@/ui/primitives/collection-card";
import type { HomeTodayTasksViewModel } from "@/ui/models/home/HomeViewModel";

export interface TodayTasksCardProps {
  readonly model: HomeTodayTasksViewModel;
  readonly onTitleChange: (title: string) => void;
  readonly onCreate: () => void;
  readonly onComplete: (taskId: string) => void;
}

export function TodayTasksCard({
  model,
  onTitleChange,
  onCreate,
  onComplete,
}: TodayTasksCardProps) {
  function handleCreate(event: FormEvent) {
    event.preventDefault();
    onCreate();
  }

  return (
    <CollectionCard
      title="Tareas de hoy"
      headerPadding="4"
      bodyClassName="divide-y divide-[var(--divider)]"
      icon={<ListChecks size={16} style={{ color: "var(--violet-soft-text)" }} />}
      action={
        <Link
          to="/tasks"
          className="text-xs transition-colors"
          style={{ color: "var(--violet-soft-text)" }}
        >
          Ver todas
        </Link>
      }
    >
        <form onSubmit={handleCreate} className="flex items-center gap-2 p-3">
          <input
            value={model.newTitle}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Agregar tarea para hoy..."
            disabled={model.isCreating}
            className="glass-input min-w-0 flex-1 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!model.canCreate}
            aria-label="Agregar tarea"
            className="btn-primary shrink-0 p-2 disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
        </form>

        {model.createError ? (
          <div className="px-3 pb-3 text-xs text-[var(--red-soft-text)]">
            {model.createError}
          </div>
        ) : null}

        {model.tasks.length > 0 ? (
          model.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--hover-overlay)]"
            >
              {task.completed ? (
                <CheckCircle2
                  size={16}
                  style={{ color: "var(--emerald-soft-text)" }}
                  className="shrink-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onComplete(task.id)}
                  disabled={task.busy}
                  aria-label={`Marcar "${task.title}" como hecha`}
                  className="group flex h-4 w-4 shrink-0 items-center justify-center rounded-md border border-[var(--glass-border)] transition-colors hover:border-[var(--accent)] disabled:opacity-50"
                >
                  <Check
                    size={11}
                    className="text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <span
                  className={`text-sm ${
                    task.completed
                      ? "text-[var(--muted)] line-through"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {task.title}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`badge text-[10px] ${task.priorityBadgeClassName}`}>
                    {task.priorityLabel}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {task.scheduledDateLabel}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-[var(--muted)]">
            No hay tareas para hoy
          </div>
        )}
    </CollectionCard>
  );
}
