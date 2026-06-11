"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, ListChecks, Plus } from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { CollectionCard } from "@/components/primitives/collection-card";
import { TaskPriorityBadge } from "@/features/tasks/components/task-priority-badge";
import { tasksApi } from "@/features/tasks/tasks-api";
import { syncTaskQueryState } from "@/features/tasks/chat-sync";
import { useTaskMutations } from "@/features/tasks/use-task-mutations";
import type { Task } from "@/lib/api/types";

export interface TodayTasksCardProps {
  readonly tasks: readonly Task[];
}

export function TodayTasksCard({ tasks }: TodayTasksCardProps) {
  const queryClient = useQueryClient();
  const { completeTask, isTaskBusy } = useTaskMutations();
  const [newTitle, setNewTitle] = useState("");

  const createMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: (task) => {
      syncTaskQueryState({
        tool: "create_task",
        parsedResult: task,
        queryClient,
      });
      setNewTitle("");
    },
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
          href="/tasks"
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
                  onClick={() => completeTask(task.id)}
                  disabled={isTaskBusy(task.id)}
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
                  <TaskPriorityBadge priority={task.priority} />
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
