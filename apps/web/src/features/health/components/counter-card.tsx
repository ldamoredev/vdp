"use client";

import { useEffect, useState } from "react";
import { Archive, RotateCcw } from "lucide-react";
import type { CounterOverview } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { counterContextLabel } from "../health-selectors";

interface CounterCardProps {
  counter: CounterOverview;
  busy: boolean;
  onRelapse: (id: string) => void;
  onArchive: (id: string) => void;
}

export function CounterCard({ counter, busy, onRelapse, onArchive }: CounterCardProps) {
  // Relapse is meaningful (it closes the attempt), so it asks twice inline.
  const [confirmingRelapse, setConfirmingRelapse] = useState(false);

  useEffect(() => {
    if (!confirmingRelapse) return;
    const timer = setTimeout(() => setConfirmingRelapse(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmingRelapse]);

  function handleRelapse() {
    if (!confirmingRelapse) {
      setConfirmingRelapse(true);
      return;
    }
    setConfirmingRelapse(false);
    onRelapse(counter.id);
  }

  return (
    <div className="rounded-xl border border-[var(--glass-border)] px-4 py-3 transition-all hover:bg-[var(--hover-overlay)]">
      <div className="flex items-center gap-4">
        <div className="shrink-0 text-center">
          <div className="font-data text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {counter.currentDays}
          </div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
            {counter.currentDays === 1 ? "día" : "días"}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-[var(--foreground)]">
            {counter.emoji ? `${counter.emoji} ` : ""}
            {counter.name}
          </span>
          <div className="mt-0.5 text-[11px] text-[var(--muted)]">
            {counterContextLabel(counter)}
          </div>
          {counter.moneyNotSpent && (
            <div className="font-data mt-1 text-xs font-semibold text-[var(--emerald-soft-text)]">
              ≈ {formatMoney(Number(counter.moneyNotSpent), "ARS")} que no se fueron
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleRelapse}
            disabled={busy}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
              confirmingRelapse
                ? "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]"
                : "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <RotateCcw size={12} />
            {confirmingRelapse ? "¿Confirmar recaída?" : "Recaí"}
          </button>
          <button
            type="button"
            onClick={() => onArchive(counter.id)}
            disabled={busy}
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
