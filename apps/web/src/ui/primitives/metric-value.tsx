import type { ReactNode } from "react";

type Tone = "default" | "muted" | "accent" | "income" | "expense" | "green" | "red";

const toneClassName: Record<Tone, string> = {
  default: "text-[var(--foreground)]",
  muted: "text-[var(--muted)]",
  accent: "text-[var(--accent)]",
  income: "text-[var(--accent-green)]",
  expense: "text-[var(--accent-red)]",
  green: "text-[var(--accent-green)]",
  red: "text-[var(--accent-red)]",
};

export function MetricValue({
  children,
  tone = "default",
  size = 16,
  weight = 600,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: number;
  weight?: number;
  className?: string;
}) {
  const classes = [
    "font-data tabular-nums",
    toneClassName[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={{ fontSize: size, fontWeight: weight }}>
      {children}
    </span>
  );
}
