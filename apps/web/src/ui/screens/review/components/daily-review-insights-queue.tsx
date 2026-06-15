import { Radar } from "lucide-react";
import type { TaskInsight } from "@/lib/api/types";

interface DailyReviewInsightsQueueProps {
  insights: TaskInsight[];
  onAcknowledgeInsight?: (insightId: string) => void;
}

export function DailyReviewInsightsQueue({
  insights,
  onAcknowledgeInsight,
}: DailyReviewInsightsQueueProps) {
  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Resolver alertas
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Deja reconocidas las señales del asistente para que mañana no arranquen como ruido.
        </p>
      </div>

      <div className="space-y-3 p-5">
        {insights.length === 0 ? (
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4 text-sm text-[var(--muted)]">
            No quedan alertas pendientes por reconocer.
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Radar size={14} className="text-[var(--accent)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {insight.title}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                    {insight.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAcknowledgeInsight?.(insight.id)}
                  disabled={!onAcknowledgeInsight}
                  className="rounded-xl border border-[var(--glass-border)] bg-[var(--background-secondary)] px-3 py-2 text-xs font-medium text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reconocer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
