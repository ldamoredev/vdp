import type { ReactNode } from "react";

export function ModuleHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  className = "",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        <div className="inline-flex max-w-full items-center rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
          <span className="truncate">{eyebrow}</span>
        </div>

        <div className="mt-3 flex min-w-0 items-center gap-3">
          {icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--accent-glow)] text-[var(--accent)]">
              {icon}
            </div>
          ) : null}
          <h2 className="min-w-0 font-display text-2xl font-bold leading-tight text-[var(--foreground)]">
            {title}
          </h2>
        </div>

        {description ? (
          <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {description}
          </div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
