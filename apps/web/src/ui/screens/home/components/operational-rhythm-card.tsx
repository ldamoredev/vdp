import { Repeat } from "lucide-react";
import type {
  HomeRhythmTone,
  HomeRhythmViewModel,
} from "@/ui/models/home/HomeViewModel";

export interface OperationalRhythmCardProps {
  readonly rhythm: HomeRhythmViewModel;
}

function toneClassName(tone: HomeRhythmTone) {
  switch (tone) {
    case "alert":
      return "text-[var(--red-soft-text)]";
    case "watch":
      return "text-[var(--amber-soft-text)]";
    case "ok":
      return "text-[var(--emerald-soft-text)]";
  }
}

export function OperationalRhythmCard({ rhythm }: OperationalRhythmCardProps) {
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
          {rhythm.periodLabel}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-data font-bold tracking-tight ${toneClassName(rhythm.tone)}`}>
            {rhythm.rateLabel}
          </span>
          <span className="text-xs text-[var(--muted)]">de arrastre</span>
        </div>

        <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
          {rhythm.message}
        </p>

        {rhythm.domains.length > 0 && (
          <div className="space-y-1.5">
            {rhythm.domains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2"
              >
                <span className="text-sm font-medium capitalize text-[var(--foreground)]">
                  {domain.label}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {domain.countLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
