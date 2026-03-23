import {
  AlertTriangle,
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
  return (
    <div
      className={`rounded-[20px] md:rounded-2xl border px-4 py-3 transition-all ${getTaskTone(task)}`}
    >
      {/* ── Desktop: compact single row ── */}
      <div className="hidden md:flex items-center gap-3">
        <button
          type="button"
          onClick={() => task.status !== "done" && onComplete(task.id)}
          disabled={task.status === "done" || busy}
          className={`task-checkbox shrink-0 ${task.status === "done" ? "checked" : ""}`}
        >
          {task.status === "done" && (
            <Check size={14} className="text-white" />
          )}
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
          <TaskPriorityBadge priority={task.priority} />
          <TaskDomainBadge domain={task.domain} />
          {task.carryOverCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--amber-soft-text)]">
              <AlertTriangle size={10} />
              {task.carryOverCount}
            </span>
          )}
          {task.carryOverCount >= 3 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--red-soft-text)]">
              Bloqueada
            </span>
          )}
        </div>

        {task.status !== "done" && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              disabled={busy}
              title="Marcar como hecha"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-all hover:scale-105 disabled:opacity-50"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => onCarryOver(task.id)}
              disabled={busy}
              title="Llevar a manana"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)] transition-all hover:scale-105 disabled:opacity-50"
            >
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onOpenDetail(task.id)}
              title="Ver detalle"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--violet-soft-text)] transition-all hover:scale-105"
            >
              <ListTodo size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDiscard(task.id)}
              disabled={busy}
              title="Descartar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)] transition-all hover:scale-105 disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
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

      {/* ── Mobile: card layout ── */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => task.status !== "done" && onComplete(task.id)}
            disabled={task.status === "done" || busy}
            className={`task-checkbox mt-0.5 shrink-0 ${task.status === "done" ? "checked" : ""}`}
          >
            {task.status === "done" && (
              <Check size={14} className="text-white" />
            )}
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
              <TaskPriorityBadge priority={task.priority} />
              <TaskDomainBadge domain={task.domain} />
              {task.carryOverCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--amber-soft-text)]">
                  <AlertTriangle size={10} />
                  {task.carryOverCount}
                </span>
              )}
              {task.carryOverCount >= 3 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--red-soft-text)]">
                  Bloqueada
                </span>
              )}
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
          <div className="flex flex-wrap gap-2 border-t border-[var(--glass-border)]/80 pt-3">
            <button
              type="button"
              onClick={() => { onComplete(task.id); onToggleActions(null); }}
              disabled={busy}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Check size={13} />
              Hecha
            </button>
            <button
              type="button"
              onClick={() => { onCarryOver(task.id); onToggleActions(null); }}
              disabled={busy}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-3 py-1.5 text-xs font-medium text-[var(--amber-soft-text)] transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <ArrowRight size={13} />
              Manana
            </button>
            <button
              type="button"
              onClick={() => { onOpenDetail(task.id); onToggleActions(null); }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-3 py-1.5 text-xs font-medium text-[var(--violet-soft-text)] transition-all hover:scale-[1.02]"
            >
              <ListTodo size={13} />
              Detalle
            </button>
            <button
              type="button"
              onClick={() => { onDiscard(task.id); onToggleActions(null); }}
              disabled={busy}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-3 py-1.5 text-xs font-medium text-[var(--red-soft-text)] transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Trash2 size={13} />
              Descartar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
