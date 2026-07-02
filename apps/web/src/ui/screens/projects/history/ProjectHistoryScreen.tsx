import { ArrowLeft, RotateCcw } from "lucide-react";
import { Link } from "react-router";

import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import { useProjectHistoryPresenter } from "./useProjectHistoryPresenter";

export function ProjectHistoryScreen() {
  const presenter = useProjectHistoryPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="4xl" spacing="6" className="domain-projects">
      <header className="flex flex-col gap-3">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft size={15} />
          Proyectos
        </Link>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            Dirección
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Historial</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Proyectos archivados. Sus horas y tareas siguen siendo legibles; desarchivá uno para volver a trabajarlo.
          </p>
        </div>
      </header>

      <section className="glass-card-static overflow-hidden">
        <div className="p-3">
          {vm.error ? (
            <StateCard state="error" size="sm" title="No pudimos cargar el historial" description={vm.error} />
          ) : vm.isLoading && vm.projects.length === 0 ? (
            <StateCard state="loading" size="sm" skeletonLines={4} />
          ) : vm.projects.length === 0 ? (
            <StateCard
              size="sm"
              title="No hay proyectos archivados"
              description="Cuando archives un proyecto, va a aparecer acá."
            />
          ) : (
            <div className="space-y-2">
              {vm.projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-[var(--radius-md)] border border-[var(--divider)] bg-[var(--card)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                          {project.kindLabel}
                        </span>
                        {project.clientLabel && (
                          <span className="text-[11px] text-[var(--muted)]">· {project.clientLabel}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--foreground)]">
                        {project.outcome}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
                        <span>
                          Archivado: <span className="font-data">{project.archivedAtLabel}</span>
                        </span>
                        <span>
                          Horas: <span className="font-data">{project.totalHoursLabel}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={project.isUnarchiving}
                      onClick={() => void presenter.unarchiveProject(project.id)}
                      className="btn-secondary shrink-0"
                    >
                      <RotateCcw size={15} />
                      {project.isUnarchiving ? "Desarchivando…" : "Desarchivar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </ModulePage>
  );
}
