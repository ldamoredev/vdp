import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useHistoryData, useHistoryActions } from "../use-history-context";

export function HistoryReviewHeader() {
  const { selectedDate, isToday, review } = useHistoryData();
  const { goBack, goForward } = useHistoryActions();

  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--glass-border)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              <History size={12} />
              Decision review
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Cierra el dia con decisiones, no solo con metricas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              Revisa que quedo pendiente, decide que se mueve y corta el
              arrastre antes de que se convierta en ruido operativo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} style={{ color: "var(--violet-soft-text)" }} />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {format(selectedDate, "EEEE, d MMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={goForward}
              disabled={isToday}
              className="rounded-xl p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {review && (
        <div className="grid gap-4 p-6 md:grid-cols-4">
          <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Total
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              {review.total}
            </div>
          </div>
          <div className="rounded-[24px] border border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Completadas
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              {review.completed}
            </div>
          </div>
          <div className="rounded-[24px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Pendientes
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              {review.pending}
            </div>
          </div>
          <div className="rounded-[24px] border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Tasa
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              {review.completionRate}%
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
