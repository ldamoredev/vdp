import { Clock3, Sparkles } from "lucide-react";

interface DailyReviewHeaderProps {
  dateLabel: string;
  progressLabel: string;
  summary?: string;
}

export function DailyReviewHeader({
  dateLabel,
  progressLabel,
  summary = "Cierra tareas, verifica wallet y deja una señal útil para mañana sin salir del mismo flujo.",
}: DailyReviewHeaderProps) {
  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
              <Sparkles size={11} />
              Ritual diario
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Cierra hoy para que mañana arranque liviano
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              {summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm text-[var(--foreground)]">
              <Clock3 size={14} className="text-[var(--accent)]" />
              {dateLabel}
            </div>
            <div className="rounded-2xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
              {progressLabel}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
