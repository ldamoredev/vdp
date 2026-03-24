import type { Task, TaskNote } from "@/lib/api/types";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import { formatTaskDate } from "../../tasks-dashboard-selectors";

interface TaskSummaryProps {
  task: Task;
  notesCount: number;
}

export function TaskSummary({ task, notesCount }: TaskSummaryProps) {
  return (
    <>
      <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Tarea seleccionada
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
              {task.title}
            </div>
          </div>
          <span className="rounded-full border border-[var(--glass-border)] bg-white/40 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {task.status === "done" ? "Hecha" : "Activa"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <TaskPriorityBadge priority={task.priority} />
          <TaskDomainBadge domain={task.domain} />
        </div>
        {task.description ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            {task.description}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Sin descripcion adicional. Si necesitas preservar contexto
            para retomarla mejor, guardalo como nota.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Fecha
          </div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {formatTaskDate(task.scheduledDate)}
          </div>
        </div>
        <div className="rounded-[20px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Carry-over
          </div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {task.carryOverCount}
          </div>
        </div>
        <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Notas
          </div>
          <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {notesCount}
          </div>
        </div>
      </div>
    </>
  );
}
