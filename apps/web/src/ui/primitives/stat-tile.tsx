import type { ReactNode } from "react";

import { MetricValue } from "@/ui/primitives/metric-value";

type Tone = "default" | "accent" | "green" | "red" | "amber" | "violet";

const toneClassName: Record<Tone, string> = {
  default: "text-[var(--foreground)]",
  accent: "text-[var(--accent)]",
  green: "text-[var(--accent-green)]",
  red: "text-[var(--accent-red)]",
  amber: "text-[var(--amber-soft-text)]",
  violet: "text-[var(--violet-soft-text)]",
};

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function StatTile({
  label,
  value,
  unit,
  sub,
  icon,
  tone = "default",
  emphasis = false,
  progressValue,
  className = "",
  children,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  emphasis?: boolean;
  progressValue?: number;
  className?: string;
  children?: ReactNode;
}) {
  const progress = typeof progressValue === "number" ? clampProgress(progressValue) : null;
  const classes = [
    "rounded-[var(--radius-md)] border p-4",
    emphasis
      ? "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]"
      : "border-[var(--glass-border)] bg-[var(--hover-overlay)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
          {label}
        </span>
        {icon ? <span className={`shrink-0 ${toneClassName[tone]}`}>{icon}</span> : null}
      </div>

      <div className="mt-2.5 flex items-end gap-1.5">
        <MetricValue size={30} weight={700} className={toneClassName[tone]}>
          {value}
        </MetricValue>
        {unit ? (
          <span className="pb-0.5 text-xs text-[var(--muted)]">{unit}</span>
        ) : null}
      </div>

      {sub ? (
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{sub}</p>
      ) : null}

      {progress !== null ? (
        <div
          className="progress-bar mt-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {children}
    </div>
  );
}
