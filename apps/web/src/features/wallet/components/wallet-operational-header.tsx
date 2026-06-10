import type { ReactNode } from "react";
import { Sparkles, Wallet } from "lucide-react";

interface WalletOperationalHeaderProps {
  title: string;
  intro: string;
  eyebrow?: string;
  action?: ReactNode;
  stats?: ReactNode;
}

export function WalletOperationalHeader({
  title,
  intro,
  eyebrow = "Resumen operativo",
  action,
  stats,
}: WalletOperationalHeaderProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
              <Sparkles size={11} />
              {eyebrow}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-glow)]">
                <Wallet size={18} className="text-[var(--accent)]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {title}
              </h2>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              {intro}
            </p>
          </div>

          {action ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {action}
            </div>
          ) : null}
        </div>
      </div>

      {stats ? <div className="grid gap-3 p-5 md:p-6 md:grid-cols-3">{stats}</div> : null}
    </div>
  );
}
