import Link from "next/link";
import { History } from "lucide-react";

export interface DayReviewCardProps {
  readonly total: number;
  readonly completed: number;
  readonly carriedToday: number;
}

export function DayReviewCard({
  total,
  completed,
  carriedToday,
}: DayReviewCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <History size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Revision del dia
          </h3>
        </div>
        <Link
          href="/tasks/history"
          className="text-xs transition-colors"
          style={{ color: "var(--violet-soft-text)" }}
        >
          Abrir historial
        </Link>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-xs text-[var(--muted)]">Total</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {total}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-xs text-[var(--muted)]">Completadas</div>
          <div
            className="mt-1 text-2xl font-semibold"
            style={{ color: "var(--emerald-soft-text)" }}
          >
            {completed}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-xs text-[var(--muted)]">Carry-over</div>
          <div
            className="mt-1 text-2xl font-semibold"
            style={{ color: "var(--amber-soft-text)" }}
          >
            {carriedToday}
          </div>
        </div>
      </div>
    </div>
  );
}
