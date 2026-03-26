import Link from "next/link";
import { CheckCircle2, ListChecks } from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import type { Task } from "@/lib/api/types";

export interface TodayTasksCardProps {
  readonly tasks: readonly Task[];
}

export function TodayTasksCard({ tasks }: TodayTasksCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <ListChecks size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Tareas de hoy
          </h3>
        </div>
        <Link
          href="/tasks"
          className="text-xs transition-colors"
          style={{ color: "var(--violet-soft-text)" }}
        >
          Ver todas
        </Link>
      </div>
      <div className="divide-y divide-[var(--divider)]">
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
                <div className="h-4 w-4 shrink-0 rounded-md border border-[var(--glass-border)]" />
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
      </div>
    </div>
  );
}
