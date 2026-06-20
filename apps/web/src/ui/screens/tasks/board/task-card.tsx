import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Calendar, CalendarClock, Check, GripVertical, Trash2 } from "lucide-react";

import type { BoardTaskActions, BoardTaskVM } from "@/ui/models/tasks/BoardViewModel";
import { TaskBadges } from "@/ui/screens/tasks/components/task-badges";

type TaskCardProps = {
  task: BoardTaskVM;
  actions: BoardTaskActions;
  /** Fades the card while it is the drag source. */
  dragging?: boolean;
  /** Shows the grip handle (only meaningful when draggable). */
  dragHandle?: boolean;
} & ComponentPropsWithoutRef<"div">;

function QuickAction({
  label,
  onClick,
  disabled = false,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] transition-all hover:scale-105 disabled:opacity-50 md:h-8 md:w-8 ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Board task card (kanban). Distinct from the dashboard's list `TaskRow` but
 * shares badges, tones and the "trabada" rule. An open task carried over 3+
 * times gets a red rail + soft surface; done/discarded states dim it and hide
 * the quick actions. Drag handlers are spread by the parent via `...rest`.
 */
export function TaskCard({
  task,
  actions,
  dragging = false,
  dragHandle = true,
  draggable = false,
  className = "",
  ...rest
}: TaskCardProps) {
  const done = task.state === "done";
  const discarded = task.state === "discarded";
  const terminal = done || discarded;

  const surface = task.isStuck
    ? "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]"
    : "border-[var(--glass-border)] bg-[var(--card)]";
  const elevation = dragging
    ? "opacity-60 shadow-[var(--shadow-lg)]"
    : terminal
      ? "opacity-65 shadow-[var(--shadow-sm)]"
      : "shadow-[var(--shadow-sm)]";

  return (
    <div
      draggable={draggable}
      className={`relative overflow-hidden rounded-[var(--radius-md)] border p-3 transition-all ${surface} ${elevation} ${
        draggable ? "cursor-grab" : ""
      } ${className}`}
      {...rest}
    >
      {task.isStuck && (
        <span
          className="absolute inset-y-2.5 left-0 w-[3px] rounded-r bg-[var(--stuck-rail)]"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-2">
        {dragHandle && draggable && (
          <span className="mt-0.5 shrink-0 cursor-grab text-[var(--muted)]" aria-hidden="true">
            <GripVertical size={15} />
          </span>
        )}
        <p
          className={`min-w-0 flex-1 text-[13px] font-medium leading-snug ${
            terminal ? "text-[var(--muted)]" : "text-[var(--foreground)]"
          } ${done ? "line-through" : ""}`}
        >
          {task.title}
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <TaskBadges priority={task.priority} domain={task.domain} carryOverCount={task.carryOverCount} />
        {task.dateLabel && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
            <Calendar size={11} />
            <span className="font-data tracking-[-0.02em]">{task.dateLabel}</span>
          </span>
        )}
      </div>

      {!terminal && (
        <div className="mt-3 flex items-center gap-1.5">
          {task.canStart && (
            <QuickAction
              label="Empezar"
              onClick={() => actions.onStart(task.id)}
              disabled={task.busy}
              className="border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--foreground)]"
            >
              <ArrowRight size={14} />
            </QuickAction>
          )}
          <QuickAction
            label="Marcar como hecha"
            onClick={() => actions.onComplete(task.id)}
            disabled={task.busy}
            className="bg-[var(--accent)] text-[var(--accent-contrast)]"
          >
            <Check size={14} />
          </QuickAction>
          <QuickAction
            label="Reprogramar a mañana"
            onClick={() => actions.onCarryOver(task.id)}
            disabled={task.busy}
            className="border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]"
          >
            <CalendarClock size={14} />
          </QuickAction>
          <QuickAction
            label="Descartar"
            onClick={() => actions.onDiscard(task.id)}
            disabled={task.busy}
            className="border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]"
          >
            <Trash2 size={14} />
          </QuickAction>
          <QuickAction
            label="Ver detalle"
            onClick={() => actions.onOpenDetail(task.id)}
            className="ml-auto border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ArrowUpRight size={14} />
          </QuickAction>
        </div>
      )}
    </div>
  );
}
