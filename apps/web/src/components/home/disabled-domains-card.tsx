import { CalendarDays, Lock } from "lucide-react";
import type { DomainConfig } from "@/lib/navigation";

export interface DisabledDomainsCardProps {
  readonly domains: readonly DomainConfig[];
}

export function DisabledDomainsCard({ domains }: DisabledDomainsCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Dominios
          </h3>
        </div>
        <span className="text-xs text-[var(--muted)]">Vida digital</span>
      </div>
      <div className="space-y-2 p-4">
        {domains.map((domain) => (
          <div
            key={domain.key}
            className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3 opacity-40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--background-secondary)]">
              <span className="text-xs font-bold text-[var(--muted)]">
                {domain.iconLetter}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--foreground)]">
                {domain.label}
              </div>
              <div className="text-[11px] text-[var(--muted)]">
                {domain.subtitle}
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-2 py-0.5">
              <Lock size={10} className="text-[var(--muted)]" />
              <span className="text-[10px] font-medium text-[var(--muted)]">
                Pronto
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
