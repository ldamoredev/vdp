import { Link } from "react-router";
import { ArrowUpRight, Radar } from "lucide-react";
import { CollectionCard } from "@/ui/primitives/collection-card";
import type {
  HomeInsightTone,
  HomeSignalViewModel,
} from "@/ui/models/home/HomeViewModel";

export interface CrossDomainSignalsCardProps {
  readonly insights: readonly HomeSignalViewModel[];
  readonly countLabel: string;
}

function getTypeBadgeClassName(type: HomeInsightTone) {
  switch (type) {
    case "achievement":
      return "border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.12)] text-[var(--emerald-soft-text)]";
    case "warning":
      return "border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.12)] text-[var(--amber-soft-text)]";
    case "suggestion":
      return "border-[color:rgba(96,165,250,0.24)] bg-[color:rgba(96,165,250,0.12)] text-[var(--accent-blue)]";
  }
}

export function CrossDomainSignalsCard({
  insights,
  countLabel,
}: CrossDomainSignalsCardProps) {
  return (
    <CollectionCard
      title="Senales cruzadas"
      headerPadding="4"
      bodyClassName="divide-y divide-[var(--divider)]"
      icon={<Radar size={16} style={{ color: "var(--violet-soft-text)" }} />}
      action={
        <span className="text-xs text-[var(--muted)]">
          {countLabel}
        </span>
      }
    >
      {insights.length > 0 ? (
        insights.map((insight) => (
          <article
            key={insight.id}
            className="space-y-3 p-4 transition-colors hover:bg-[var(--hover-overlay)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${getTypeBadgeClassName(insight.tone)}`}
                  >
                    {insight.typeLabel}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    {insight.domainLabel}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-[var(--foreground)]">
                  {insight.title}
                </h4>
              </div>
              <span className="shrink-0 text-[11px] text-[var(--muted)]">
                {insight.dateLabel}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
              {insight.message}
            </p>

            {insight.periodLabel ? (
              <p className="text-[11px] text-[var(--muted)]">
                {insight.periodLabel}
              </p>
            ) : null}

            {insight.action ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--muted)]">
                  {insight.action.domainLabel}
                </span>
                <Link
                  to={insight.action.href}
                  className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: "var(--violet-soft-text)" }}
                >
                  {insight.action.label}
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            ) : null}
          </article>
        ))
      ) : (
        <div className="p-4 text-sm text-[var(--muted)]">
          Todavia no hay insights recientes
        </div>
      )}
    </CollectionCard>
  );
}
