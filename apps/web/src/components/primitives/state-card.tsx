import type { ReactNode } from "react";

type Tone = "default" | "soft";
type Size = "sm" | "md" | "lg";

const containerClassName: Record<Tone, string> = {
  default:
    "rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)]",
  soft: "rounded-[28px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)]",
};

const paddingClassName: Record<Size, string> = {
  sm: "px-4 py-6",
  md: "px-5 py-10",
  lg: "px-6 py-16",
};

export function StateCard({
  icon,
  title,
  description,
  children,
  tone = "default",
  size = "md",
  className = "",
}: {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  const classes = [
    containerClassName[tone],
    paddingClassName[size],
    "text-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {icon ? <div className="mx-auto mb-4 flex w-fit">{icon}</div> : null}
      {title ? (
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      ) : null}
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
