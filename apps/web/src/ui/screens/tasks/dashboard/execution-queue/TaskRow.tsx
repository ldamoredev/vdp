import { ArrowRight, Check, ListTodo, MoreHorizontal, Trash2, X } from "lucide-react";

import type { TaskRowVM } from "@/ui/models/tasks/ExecutionQueueViewModel";
import { TaskBadges } from "@/ui/screens/tasks/components/task-badges";

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
    <TaskBadges priority={task.priority} domain={task.domain} carryOverCount={task.carryOverCount} />
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
    ? "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
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
        className={`${sizeClass} bg-[var(--accent)] text-[var(--accent-contrast)]`}
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
        title="Llevar a mañana"
      >
        <ArrowRight size={isCompact ? 13 : 14} />
        {isCompact && "Mañana"}
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

function CompletionButton({
  task,
  actions,
  compact = false,
}: {
  task: TaskRowVM;
  actions: TaskRowActions;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !task.done && actions.onComplete(task.id)}
      disabled={task.done || task.busy}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl transition-all hover:bg-[var(--hover-overlay)] disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "h-11 w-11" : "h-8 w-8"
      }`}
      aria-label={task.done ? `"${task.title}" ya está hecha` : `Marcar "${task.title}" como hecha`}
    >
      <span
        className={`task-checkbox pointer-events-none inline-flex items-center justify-center ${
          task.done ? "checked" : ""
        }`}
      >
        {task.done && <Check size={14} className="text-[var(--accent-contrast)]" />}
      </span>
    </button>
  );
}

export function TaskRow({ task, actions }: { task: TaskRowVM; actions: TaskRowActions }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border px-4 py-3 transition-all hover:shadow-sm ${task.toneClass}`}>
      {task.isStuck && <div className="absolute inset-y-0 left-0 w-[3px] bg-[var(--stuck-rail)]" aria-hidden="true" />}
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <CompletionButton task={task} actions={actions} />

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
          <CompletionButton task={task} actions={actions} compact />

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
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)]"
              aria-label={task.actionsOpen ? "Cerrar acciones" : "Abrir acciones"}
            >
              {task.actionsOpen ? <X size={14} /> : <MoreHorizontal size={14} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => actions.onDelete(task.id)}
              disabled={task.busy}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] disabled:opacity-50"
              aria-label="Borrar tarea"
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
