import { Link } from "react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, ListChecks, Plus } from "lucide-react";
import { useCore } from "@/CoreProvider";
import { CollectionCard } from "@/ui/primitives/collection-card";
import { CompleteTask } from "@/core/app/tasks/CompleteTask";
import { CreateTask } from "@/core/app/tasks/CreateTask";
import type { Task } from "@/core/domain/tasks/Task";
import { useTasksEvents } from "@/TasksEventsProvider";
import { formatDateShort, getTodayISO, priorityBadge, priorityLabel } from "@/lib/format";
import { homeTaskQueryKeys } from "../home-query-keys";

export interface TodayTasksCardProps {
  readonly tasks: readonly Task[];
}

export function TodayTasksCard({ tasks }: TodayTasksCardProps) {
  const core = useCore();
  const queryClient = useQueryClient();
  const tasksEvents = useTasksEvents();
  const today = getTodayISO();
  const [newTitle, setNewTitle] = useState("");
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());

  function refreshTasks() {
    void queryClient.invalidateQueries({ queryKey: homeTaskQueryKeys.taskStats });
    void queryClient.invalidateQueries({ queryKey: homeTaskQueryKeys.tasksToday(today) });
    void queryClient.invalidateQueries({ queryKey: homeTaskQueryKeys.review(today) });
    void queryClient.invalidateQueries({ queryKey: homeTaskQueryKeys.trend(7) });
    void queryClient.invalidateQueries({ queryKey: ["home", "tasks"] });
    void tasksEvents.emitTasksChanged();
  }

  const createMutation = useMutation({
    mutationFn: (input: { title: string; priority: number }) => core.execute(new CreateTask(input)),
    onSuccess: () => {
      setNewTitle("");
      refreshTasks();
    },
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => core.execute(new CompleteTask(taskId)),
    onMutate: (taskId) => {
      setBusyIds((current) => new Set(current).add(taskId));
    },
    onSettled: (_data, _error, taskId) => {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
    },
    onSuccess: refreshTasks,
  });

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed || createMutation.isPending) return;
    createMutation.mutate({ title: trimmed, priority: 2 });
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
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Agregar tarea para hoy..."
            disabled={createMutation.isPending}
            className="glass-input min-w-0 flex-1 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || createMutation.isPending}
            aria-label="Agregar tarea"
            className="btn-primary shrink-0 p-2 disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
        </form>

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--hover-overlay)]"
            >
              {task.status === "done" ? (
                <CheckCircle2
                  size={16}
                  style={{ color: "var(--emerald-soft-text)" }}
                  className="shrink-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => completeMutation.mutate(task.id)}
                  disabled={busyIds.has(task.id)}
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
                    task.status === "done"
                      ? "text-[var(--muted)] line-through"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {task.title}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`badge text-[10px] ${priorityBadge(task.priority)}`}>
                    {priorityLabel(task.priority)}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {formatDateShort(task.scheduledDate)}
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
