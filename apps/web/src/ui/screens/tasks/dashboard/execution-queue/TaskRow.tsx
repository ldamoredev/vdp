import { ArrowRight, Check, ListTodo, MoreHorizontal, Trash2, X } from "lucide-react";

import type { TaskRowVM } from "@/ui/models/tasks/ExecutionQueueViewModel";
import { CarryOverBadge } from "@/ui/screens/tasks/components/carry-over-badge";
import { TaskDomainBadge } from "@/ui/screens/tasks/components/task-domain-badge";
import { TaskPriorityBadge } from "@/ui/screens/tasks/components/task-priority-badge";

export interface TaskRowActions {
  onComplete: (id: string) => void;
  onCarryOver: (id: string) => void;
  onDiscard: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onToggleActions: (id: string | null) => void;
}

function Badges({ task }: { task: TaskRowVM }) {
  return (
    <>
      <TaskPriorityBadge priority={task.priority} />
      <TaskDomainBadge domain={task.domain} />
      <CarryOverBadge count={task.carryOverCount} />
    </>
  );
}

function Actions({
  task,
  isCompact,
  actions,
}: {
  task: TaskRowVM;
  isCompact: boolean;
  actions: TaskRowActions;
}) {
  const close = () => actions.onToggleActions(null);
  const sizeClass = isCompact
    ? "inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
    : "inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:scale-105 disabled:opacity-50";

  return (
    <div
      className={
        isCompact
          ? "flex flex-wrap gap-2 border-t border-[var(--glass-border)]/80 pt-3"
          : "flex shrink-0 items-center gap-1"
      }
    >
      <button
        type="button"
        onClick={() => {
          actions.onComplete(task.id);
          close();
        }}
        disabled={task.busy}
        className={`${sizeClass} bg-[var(--accent)] text-white`}
        title="Marcar como hecha"
      >
        <Check size={isCompact ? 13 : 14} />
        {isCompact && "Hecha"}
      </button>
      <button
        type="button"
        onClick={() => {
          actions.onCarryOver(task.id);
          close();
        }}
        disabled={task.busy}
        className={`${sizeClass} border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]`}
        title="Llevar a manana"
      >
        <ArrowRight size={isCompact ? 13 : 14} />
        {isCompact && "Manana"}
      </button>
      <button
        type="button"
        onClick={() => {
          actions.onOpenDetail(task.id);
          close();
        }}
        className={`${sizeClass} border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--violet-soft-text)]`}
        title="Ver detalle"
      >
        <ListTodo size={isCompact ? 13 : 14} />
        {isCompact && "Detalle"}
      </button>
      <button
        type="button"
        onClick={() => {
          actions.onDiscard(task.id);
          close();
        }}
        disabled={task.busy}
        className={`${sizeClass} border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]`}
        title="Descartar"
      >
        <Trash2 size={isCompact ? 13 : 14} />
        {isCompact && "Descartar"}
      </button>
    </div>
  );
}

export function TaskRow({ task, actions }: { task: TaskRowVM; actions: TaskRowActions }) {
  return (
    <div className={`rounded-xl border px-4 py-3 transition-all hover:shadow-sm ${task.toneClass}`}>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <button
          type="button"
          onClick={() => !task.done && actions.onComplete(task.id)}
          disabled={task.done || task.busy}
          className={`task-checkbox shrink-0 ${task.done ? "checked" : ""}`}
          aria-label={task.done ? `"${task.title}" ya esta hecha` : `Marcar "${task.title}" como hecha`}
        >
          {task.done && <Check size={14} className="text-white" />}
        </button>

        <span
          className={`min-w-0 flex-1 truncate text-sm font-medium ${
            task.done ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"
          }`}
          title={task.title}
        >
          {task.title}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badges task={task} />
        </div>

        {!task.done ? (
          <Actions task={task} isCompact={false} actions={actions} />
        ) : (
          <button
            type="button"
            onClick={() => actions.onDelete(task.id)}
            disabled={task.busy}
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
            onClick={() => !task.done && actions.onComplete(task.id)}
            disabled={task.done || task.busy}
            className={`task-checkbox mt-0.5 shrink-0 ${task.done ? "checked" : ""}`}
            aria-label={task.done ? `"${task.title}" ya esta hecha` : `Marcar "${task.title}" como hecha`}
          >
            {task.done && <Check size={14} className="text-white" />}
          </button>

          <div className="min-w-0 flex-1">
            <span
              className={`text-sm font-medium leading-tight ${
                task.done ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"
              }`}
            >
              {task.title}
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badges task={task} />
            </div>
          </div>

          {!task.done ? (
            <button
              type="button"
              onClick={() => actions.onToggleActions(task.actionsOpen ? null : task.id)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)]"
            >
              {task.actionsOpen ? <X size={14} /> : <MoreHorizontal size={14} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => actions.onDelete(task.id)}
              disabled={task.busy}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {task.actionsOpen && !task.done && <Actions task={task} isCompact actions={actions} />}
      </div>
    </div>
  );
}
