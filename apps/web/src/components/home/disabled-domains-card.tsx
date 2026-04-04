import { Layers, Lock } from "lucide-react";
import type { DomainConfig } from "@/lib/navigation";

export interface DisabledDomainsCardProps {
  readonly domains: readonly DomainConfig[];
}

export function DisabledDomainsCard({ domains }: DisabledDomainsCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <Layers size={16} style={{ color: "var(--muted)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Próximos módulos
          </h3>
        </div>
        <span className="text-xs text-[var(--muted)]">{domains.length}</span>
      </div>
      <div className="space-y-1.5 p-3">
        {domains.map((domain) => (
          <div
            key={domain.key}
            className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3 opacity-50"
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
              <div className="text-[11px] text-[var(--muted)] truncate">
                {domain.subtitle}
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-2 py-0.5">
              <Lock size={9} className="text-[var(--muted)]" />
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
