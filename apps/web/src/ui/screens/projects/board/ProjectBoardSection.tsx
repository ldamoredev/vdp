import { Search, Sparkles } from "lucide-react";

import type { ProjectBoardColumnId } from "@/ui/models/projects/ProjectBoardViewModel";
import { StateCard } from "@/ui/primitives/state-card";
import { useProjectBoardPresenter } from "./useProjectBoardPresenter";

const NEXT_COLUMNS: ProjectBoardColumnId[] = ["backlog", "next", "doing", "done"];

export function ProjectBoardSection({ projectId }: { projectId: string | null }) {
  const presenter = useProjectBoardPresenter(projectId);
  const vm = presenter.model;

  if (!projectId) {
    return (
      <section className="glass-card-static p-6">
        <StateCard title="Elegí un proyecto" description="El board muestra las tareas existentes asociadas." />
      </section>
    );
  }

  return (
    <section className="glass-card-static overflow-hidden">
      <header className="flex flex-col gap-4 border-b border-[var(--divider)] p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            Board del proyecto
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-[var(--foreground)]">
            {vm.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{vm.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={vm.reviewAction.isDisabled}
            onClick={() => presenter.startProjectReviewChat()}
            className="btn-secondary shrink-0"
          >
            <Search size={16} />
            {vm.reviewAction.label}
          </button>
          <button
            type="button"
            disabled={vm.breakdownAction.isDisabled}
            onClick={() => presenter.startBreakdownChat()}
            className="btn-secondary shrink-0"
          >
            <Sparkles size={16} />
            {vm.breakdownAction.label}
          </button>
        </div>
      </header>

      <div className="p-5">
        {vm.error ? (
          <StateCard state="error" title="No pudimos cargar el board" description={vm.error} />
        ) : vm.isLoading && vm.columns.every((column) => column.count === 0) ? (
          <StateCard state="loading" skeletonLines={4} />
        ) : (
          <div
            aria-label="Columnas del board"
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3"
          >
            {vm.columns.map((column) => (
              <div
                key={column.id}
                className="min-h-64 rounded-[var(--radius-md)] border border-[var(--divider)] bg-[var(--surface)] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{column.title}</h3>
                  <span className="font-data text-xs text-[var(--muted)]">{column.count}</span>
                </div>
                <div className="space-y-2">
                  {column.tasks.length === 0 ? (
                    <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--divider)] px-3 py-6 text-center text-xs text-[var(--muted)]">
                      {column.emptyText}
                    </p>
                  ) : (
                    column.tasks.map((task) => (
                      <article
                        key={task.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--card)] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            title={task.title}
                            className="line-clamp-4 text-sm font-medium leading-snug text-[var(--foreground)]"
                          >
                            {task.title}
                          </p>
                          <span className="font-data text-[11px] text-[var(--muted)]">{task.priorityLabel}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">{task.statusLabel}</p>
                        <select
                          aria-label={`Mover ${task.title}`}
                          value=""
                          disabled={task.isBusy}
                          onChange={(event) => {
                            const target = event.target.value as ProjectBoardColumnId;
                            if (target) void presenter.moveTask(task.id, target);
                          }}
                          className="mt-3 min-h-9 w-full rounded-full border border-[var(--divider)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--muted)] outline-none transition hover:text-[var(--foreground)] focus:border-[var(--accent)] disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Mover a…
                          </option>
                          {NEXT_COLUMNS.filter((target) => target !== column.id).map((target) => (
                            <option key={target} value={target}>
                              {targetLabel(target)}
                            </option>
                          ))}
                        </select>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function targetLabel(column: ProjectBoardColumnId): string {
  if (column === "backlog") return "Backlog";
  if (column === "next") return "Próximo";
  if (column === "doing") return "Foco";
  return "Hecho";
}
