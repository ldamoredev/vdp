import {
  ArrowRight,
  Check,
  ListTodo,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type { Task } from "@/lib/api/types";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import { CarryOverBadge } from "@/components/tasks/carry-over-badge";
import { getTaskTone } from "../tasks-dashboard-selectors";

interface TaskRowProps {
  task: Task;
  busy: boolean;
  actionsOpen: boolean;
  onComplete: (id: string) => void;
  onCarryOver: (id: string) => void;
  onDiscard: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onToggleActions: (id: string | null) => void;
}

function TaskBadges({ task }: { task: Task }) {
  return (
    <>
      <TaskPriorityBadge priority={task.priority} />
      <TaskDomainBadge domain={task.domain} />
      <CarryOverBadge count={task.carryOverCount} />
    </>
  );
}

function TaskActions({
  task,
  busy,
  isCompact,
  onComplete,
  onCarryOver,
  onDiscard,
  onOpenDetail,
  onToggleActions,
}: {
  task: Task;
  busy: boolean;
  isCompact: boolean;
  onComplete: (id: string) => void;
  onCarryOver: (id: string) => void;
  onDiscard: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onToggleActions?: (id: string | null) => void;
}) {
  const close = () => onToggleActions?.(null);
  const sizeClass = isCompact
    ? "inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
    : "inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:scale-105 disabled:opacity-50";

  return (
    <div className={isCompact ? "flex flex-wrap gap-2 border-t border-[var(--glass-border)]/80 pt-3" : "flex shrink-0 items-center gap-1"}>
      <button
        type="button"
        onClick={() => { onComplete(task.id); close(); }}
        disabled={busy}
        className={`${sizeClass} bg-[var(--accent)] text-white`}
        title="Marcar como hecha"
      >
        <Check size={isCompact ? 13 : 14} />
        {isCompact && "Hecha"}
      </button>
      <button
        type="button"
        onClick={() => { onCarryOver(task.id); close(); }}
        disabled={busy}
        className={`${sizeClass} border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]`}
        title="Llevar a manana"
      >
        <ArrowRight size={isCompact ? 13 : 14} />
        {isCompact && "Manana"}
      </button>
      <button
        type="button"
        onClick={() => { onOpenDetail(task.id); close(); }}
        className={`${sizeClass} border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--violet-soft-text)]`}
        title="Ver detalle"
      >
        <ListTodo size={isCompact ? 13 : 14} />
        {isCompact && "Detalle"}
      </button>
      <button
        type="button"
        onClick={() => { onDiscard(task.id); close(); }}
        disabled={busy}
        className={`${sizeClass} border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]`}
        title="Descartar"
      >
        <Trash2 size={isCompact ? 13 : 14} />
        {isCompact && "Descartar"}
      </button>
    </div>
  );
}

export function TaskRow({
  task,
  busy,
  actionsOpen,
  onComplete,
  onCarryOver,
  onDiscard,
  onDelete,
  onOpenDetail,
  onToggleActions,
}: TaskRowProps) {
  const actionProps = { task, busy, onComplete, onCarryOver, onDiscard, onOpenDetail };

  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-all hover:shadow-sm ${getTaskTone(task)}`}
    >
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <button
          type="button"
          onClick={() => task.status !== "done" && onComplete(task.id)}
          disabled={task.status === "done" || busy}
          className={`task-checkbox shrink-0 ${task.status === "done" ? "checked" : ""}`}
        >
          {task.status === "done" && <Check size={14} className="text-white" />}
        </button>

        <span
          className={`min-w-0 flex-1 truncate text-sm font-medium ${
            task.status === "done"
              ? "text-[var(--muted)] line-through"
              : "text-[var(--foreground)]"
          }`}
          title={task.title}
        >
          {task.title}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <TaskBadges task={task} />
        </div>

        {task.status !== "done" && (
          <TaskActions {...actionProps} isCompact={false} />
        )}
        {task.status === "done" && (
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            disabled={busy}
            title="Borrar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)] transition-all hover:scale-105 hover:text-[var(--foreground)] disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => task.status !== "done" && onComplete(task.id)}
            disabled={task.status === "done" || busy}
            className={`task-checkbox mt-0.5 shrink-0 ${task.status === "done" ? "checked" : ""}`}
          >
            {task.status === "done" && <Check size={14} className="text-white" />}
          </button>

          <div className="min-w-0 flex-1">
            <span
              className={`text-sm font-medium leading-tight ${
                task.status === "done"
                  ? "text-[var(--muted)] line-through"
                  : "text-[var(--foreground)]"
              }`}
            >
              {task.title}
            </span>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <TaskBadges task={task} />
            </div>
          </div>

          {task.status !== "done" ? (
            <button
              type="button"
              onClick={() => onToggleActions(actionsOpen ? null : task.id)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)]"
            >
              {actionsOpen ? <X size={14} /> : <MoreHorizontal size={14} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              disabled={busy}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {actionsOpen && task.status !== "done" && (
          <TaskActions {...actionProps} isCompact onToggleActions={onToggleActions} />
        )}
      </div>
    </div>
  );
}
