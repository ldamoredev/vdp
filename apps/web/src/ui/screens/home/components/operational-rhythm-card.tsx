import { Repeat } from "lucide-react";
import type { CarryOverRateResponse, DomainStat } from "@/lib/api/types";

export interface OperationalRhythmCardProps {
  readonly carryOver?: CarryOverRateResponse;
  readonly byDomain?: readonly DomainStat[];
}

export type RhythmTone = "ok" | "watch" | "alert";

export function buildRhythmSummary(carryOver?: CarryOverRateResponse): {
  tone: RhythmTone;
  message: string;
} {
  if (!carryOver || carryOver.total === 0) {
    return {
      tone: "ok",
      message: "Sin datos suficientes todavía — cargá y cerrá tareas unos días.",
    };
  }

  if (carryOver.rate > 40) {
    return {
      tone: "alert",
      message: `Arrastre alto: ${carryOver.carriedOver} de ${carryOver.total} tareas se patearon. El plan diario no está cerrando.`,
    };
  }

  if (carryOver.rate > 20) {
    return {
      tone: "watch",
      message: `Arrastre moderado: ${carryOver.carriedOver} de ${carryOver.total} tareas se patearon. Vigilalo.`,
    };
  }

  return {
    tone: "ok",
    message: `Arrastre sano: ${carryOver.carriedOver} de ${carryOver.total} tareas se patearon.`,
  };
}

function toneClassName(tone: RhythmTone) {
  switch (tone) {
    case "alert":
      return "text-[var(--red-soft-text)]";
    case "watch":
      return "text-[var(--amber-soft-text)]";
    case "ok":
      return "text-[var(--emerald-soft-text)]";
  }
}

export function OperationalRhythmCard({ carryOver, byDomain }: OperationalRhythmCardProps) {
  const summary = buildRhythmSummary(carryOver);
  const topDomains = [...(byDomain ?? [])]
    .filter((stat) => stat.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <Repeat size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Ritmo operacional
          </h3>
        </div>
        <span className="text-xs text-[var(--muted)]">
          {carryOver ? `últimos ${carryOver.days} días` : "últimos 7 días"}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-data font-bold tracking-tight ${toneClassName(summary.tone)}`}>
            {carryOver ? `${carryOver.rate}%` : "—"}
          </span>
          <span className="text-xs text-[var(--muted)]">de arrastre</span>
        </div>

        <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
          {summary.message}
        </p>

        {topDomains.length > 0 && (
          <div className="space-y-1.5">
            {topDomains.map((stat) => (
              <div
                key={stat.domain || "none"}
                className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2"
              >
                <span className="text-sm font-medium capitalize text-[var(--foreground)]">
                  {stat.domain || "Sin dominio"}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {stat.count} completadas
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
