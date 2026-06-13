import { Archive, RotateCcw } from "lucide-react";

import type { CounterCardVM } from "@/ui/models/health/CountersViewModel";

interface CounterCardProps {
  counter: CounterCardVM;
  onRelapse: (id: string) => void;
  onArchive: (id: string) => void;
}

export function CounterCard({ counter, onRelapse, onArchive }: CounterCardProps) {
  return (
    <div className="rounded-xl border border-[var(--glass-border)] px-4 py-3 transition-all hover:bg-[var(--hover-overlay)]">
      <div className="flex items-center gap-4">
        <div className="shrink-0 text-center">
          <div className="font-data text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {counter.currentDays}
          </div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
            {counter.daysUnit}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-[var(--foreground)]">{counter.displayName}</span>
          <div className="mt-0.5 text-[11px] text-[var(--muted)]">{counter.contextLabel}</div>
          {counter.moneyNotSpentLabel && (
            <div className="font-data mt-1 text-xs font-semibold text-[var(--emerald-soft-text)]">
              {counter.moneyNotSpentLabel}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRelapse(counter.id)}
            disabled={counter.busy}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
              counter.confirmingRelapse
                ? "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]"
                : "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <RotateCcw size={12} />
            {counter.confirmingRelapse ? "¿Confirmar recaída?" : "Recaí"}
          </button>
          <button
            type="button"
            onClick={() => onArchive(counter.id)}
            disabled={counter.busy}
            title="Archivar contador"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] disabled:opacity-50"
          >
            <Archive size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
