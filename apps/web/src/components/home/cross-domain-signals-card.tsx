import Link from "next/link";
import { Radar, ArrowUpRight } from "lucide-react";
import { CollectionCard } from "@/components/primitives/collection-card";
import { getDomainConfig } from "@/lib/navigation";
import type {
  TaskInsight,
  TaskInsightAction,
  TaskInsightMetadata,
} from "@/lib/api/types";

export interface CrossDomainSignalsCardProps {
  readonly insights: readonly TaskInsight[];
}

function formatInsightDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDomainLabel(domain: string | undefined) {
  if (!domain) return "Sistema";
  return getDomainConfig(domain)?.label ?? `${domain.charAt(0).toUpperCase()}${domain.slice(1)}`;
}

function readMetadataString(
  metadata: TaskInsightMetadata | undefined,
  key: keyof TaskInsightMetadata,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function inferDomainFromHref(href: string) {
  try {
    const url = href.startsWith("http://") || href.startsWith("https://")
      ? new URL(href)
      : new URL(href, "https://vdp.local");

    return url.pathname.split("/").filter(Boolean)[0];
  } catch {
    return undefined;
  }
}

function inferDomainFromSource(source: string | undefined) {
  return source?.split(".")[0] || undefined;
}

function resolveInsightAction(insight: TaskInsight): TaskInsightAction | undefined {
  if (insight.action) {
    return insight.action;
  }

  const href = readMetadataString(insight.metadata, "actionHref");
  const label = readMetadataString(insight.metadata, "actionLabel");

  if (!href || !label) {
    return undefined;
  }

  return {
    href,
    label,
    domain:
      readMetadataString(insight.metadata, "actionDomain") ??
      readMetadataString(insight.metadata, "domain") ??
      inferDomainFromHref(href) ??
      inferDomainFromSource(readMetadataString(insight.metadata, "source")) ??
      "tasks",
  };
}

function getTypeLabel(type: TaskInsight["type"]) {
  switch (type) {
    case "achievement":
      return "Logro";
    case "warning":
      return "Alerta";
    case "suggestion":
      return "Sugerencia";
  }
}

function getTypeBadgeClassName(type: TaskInsight["type"]) {
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
}: CrossDomainSignalsCardProps) {
  return (
    <CollectionCard
      title="Senales cruzadas"
      headerPadding="4"
      bodyClassName="divide-y divide-[var(--divider)]"
      icon={<Radar size={16} style={{ color: "var(--violet-soft-text)" }} />}
      action={
        <span className="text-xs text-[var(--muted)]">
          {insights.length} reciente{insights.length === 1 ? "" : "s"}
        </span>
      }
    >
      {insights.length > 0 ? (
        insights.map((insight) => {
          const action = resolveInsightAction(insight);

          return (
            <article
              key={insight.id}
              className="space-y-3 p-4 transition-colors hover:bg-[var(--hover-overlay)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${getTypeBadgeClassName(insight.type)}`}
                    >
                      {getTypeLabel(insight.type)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {getDomainLabel(action?.domain)}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-[var(--foreground)]">
                    {insight.title}
                  </h4>
                </div>
                <span className="shrink-0 text-[11px] text-[var(--muted)]">
                  {formatInsightDate(insight.createdAt)}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                {insight.message}
              </p>

              {action ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--muted)]">
                    {getDomainLabel(action.domain)}
                  </span>
                  <Link
                    href={action.href}
                    className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: "var(--violet-soft-text)" }}
                  >
                    {action.label}
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })
      ) : (
        <div className="p-4 text-sm text-[var(--muted)]">
          Todavia no hay insights recientes
        </div>
      )}
    </CollectionCard>
  );
}
