import { Link } from "react-router";
import { ArrowRight, Loader2, Plus, Target } from "lucide-react";

import { CollectionCard } from "@/ui/primitives/collection-card";
import type { HomeObjectivesViewModel } from "@/ui/models/home/HomeViewModel";

export interface ObjectivesNorthCardProps {
  readonly model: HomeObjectivesViewModel;
  readonly onCreateTask: (objectiveId: string) => void;
}

export function ObjectivesNorthCard({ model, onCreateTask }: ObjectivesNorthCardProps) {
  return (
    <CollectionCard
      title="Metas"
      headerPadding="4"
      bodyClassName="p-4"
      icon={<Target size={16} style={{ color: "var(--pink-soft-text)" }} />}
      action={
        <Link
          to={model.href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pink-soft-text)] transition-colors hover:text-[var(--accent)]"
        >
          Ver metas
          <ArrowRight size={12} />
        </Link>
      }
    >
      {model.items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {model.items.map((objective) => (
            <article
              key={objective.id}
              className="min-w-0 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {objective.title}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-[var(--muted)]">
                    {objective.sourceLabel} · {objective.periodLabel}
                  </p>
                </div>
                <span className="shrink-0 font-data text-sm font-semibold text-[var(--foreground)]">
                  {objective.progressLabel}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--progress-track)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                  style={{ width: `${objective.progressPercent}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--muted)]">
                <span className="font-data">{objective.currentValueLabel}</span>
                <span className="font-data">{objective.targetValueLabel}</span>
              </div>

              <button
                type="button"
                onClick={() => onCreateTask(objective.id)}
                disabled={objective.isCreatingTask}
                className="btn-secondary mt-3 min-h-9 w-full justify-center text-xs disabled:opacity-50"
              >
                {objective.isCreatingTask ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Crear tarea para hoy
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4 text-sm text-[var(--muted)]">
          No hay metas activas.
        </div>
      )}
    </CollectionCard>
  );
}
