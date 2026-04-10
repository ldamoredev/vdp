import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export interface DailyRitualCardProps {
  statusLabel: string;
  href: string;
  ctaLabel: string;
  taskCount: number;
  walletCount: number;
  insightCount: number;
  noteSummary?: string;
}

export function DailyRitualCard({
  statusLabel,
  href,
  ctaLabel,
  taskCount,
  walletCount,
  insightCount,
  noteSummary,
}: DailyRitualCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Ritual diario
          </h3>
        </div>
        <span className="rounded-full border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--foreground)]">
          {statusLabel}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="text-xs text-[var(--muted)]">Tareas</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {taskCount}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="text-xs text-[var(--muted)]">Wallet</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {walletCount}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="text-xs text-[var(--muted)]">Alertas</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {insightCount}
            </div>
          </div>
        </div>

        {noteSummary ? (
          <div className="rounded-xl border border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] p-3 text-sm text-[var(--foreground)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--emerald-soft-text)]" />
              {noteSummary}
            </div>
          </div>
        ) : null}

        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "var(--violet-soft-text)" }}
        >
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
