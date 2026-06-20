import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Plus } from "lucide-react";

import type { BoardColumnTone } from "@/ui/models/tasks/BoardViewModel";

const dotByTone: Record<BoardColumnTone, string> = {
  accent: "bg-[var(--accent)]",
  green: "bg-[var(--accent-green)]",
  amber: "bg-[var(--amber-soft-text)]",
  red: "bg-[var(--accent-red)]",
  muted: "bg-[var(--muted)]",
};

type BoardColumnProps = {
  title: string;
  count?: number;
  tone?: BoardColumnTone;
  /** Renders the "+" affordance when provided (non-terminal columns). */
  onAdd?: () => void;
  /** Highlights the column with an accent ring while a card hovers over it. */
  isDropTarget?: boolean;
  empty?: string;
  children?: ReactNode;
} & ComponentPropsWithoutRef<"section">;

/**
 * Kanban column shell for the per-module board: a header (status dot + title +
 * count + optional add button) over a scrollable stack of cards with a dashed
 * empty state. Native drag-over / drop handlers are spread by the parent via
 * `...rest`, which also owns the column → status mapping.
 */
export function BoardColumn({
  title,
  count,
  tone = "muted",
  onAdd,
  isDropTarget = false,
  empty = "Sin tareas",
  className = "",
  children,
  ...rest
}: BoardColumnProps) {
  const isEmpty = Children.count(children) === 0;

  return (
    <section
      className={`flex min-w-0 flex-col rounded-[var(--radius-lg)] border transition-all ${
        isDropTarget
          ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] shadow-[0_0_0_3px_var(--accent-glow)]"
          : "border-[var(--glass-border)] bg-[var(--hover-overlay)]"
      } ${className}`}
      {...rest}
    >
      <header className="flex items-center gap-2 border-b border-[var(--divider)] px-3.5 py-3">
        <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${dotByTone[tone]}`} aria-hidden="true" />
        <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">{title}</h3>
        {count != null && (
          <span className="font-data min-w-5 rounded-full bg-[var(--muted-bg)] px-1.5 py-px text-center text-[11px] font-semibold text-[var(--muted)]">
            {count}
          </span>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            title="Crear tarea en esta columna"
            aria-label="Crear tarea"
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--card)] text-[var(--muted)] transition-all hover:text-[var(--foreground)]"
          >
            <Plus size={14} />
          </button>
        )}
      </header>

      <div className="flex min-h-20 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {isEmpty ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--divider)] px-3 py-6 text-center text-xs leading-relaxed text-[var(--muted)]">
            {empty}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
