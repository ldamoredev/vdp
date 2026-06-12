import { Archive, Check, Flame } from "lucide-react";
import type { HabitOverview } from "@/lib/api/types";
import { streakLabel } from "../health-selectors";

interface HabitRowProps {
  habit: HabitOverview;
  busy: boolean;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function HabitRow({ habit, busy, onComplete, onUncomplete, onArchive }: HabitRowProps) {
  const label = streakLabel(habit);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] px-4 py-3 transition-all hover:bg-[var(--hover-overlay)]">
      <button
        type="button"
        onClick={() => (habit.completedToday ? onUncomplete(habit.id) : onComplete(habit.id))}
        disabled={busy}
        aria-label={
          habit.completedToday
            ? `Desmarcar "${habit.name}"`
            : `Marcar "${habit.name}" como hecho hoy`
        }
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-all disabled:opacity-50 ${
          habit.completedToday
            ? "border-transparent bg-[var(--accent)] text-white"
            : "border-[var(--glass-border)] hover:border-[var(--accent)]"
        }`}
      >
        {habit.completedToday && <Check size={15} />}
      </button>

      <div className="min-w-0 flex-1">
        <span
          className={`text-sm font-medium ${
            habit.completedToday ? "text-[var(--muted)]" : "text-[var(--foreground)]"
          }`}
        >
          {habit.emoji ? `${habit.emoji} ` : ""}
          {habit.name}
        </span>
        {label && (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--muted)]">
            {habit.streak >= 2 && (
              <Flame size={11} className="text-[var(--amber-soft-text)]" />
            )}
            {label}
          </div>
        )}
      </div>

      {habit.streak >= 2 && (
        <span className="font-data shrink-0 text-sm font-bold text-[var(--foreground)]">
          {habit.streak}
        </span>
      )}

      <button
        type="button"
        onClick={() => onArchive(habit.id)}
        disabled={busy}
        title="Archivar hábito"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] opacity-0 transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] focus:opacity-100 disabled:opacity-50 [div:hover>&]:opacity-100"
      >
        <Archive size={14} />
      </button>
    </div>
  );
}
