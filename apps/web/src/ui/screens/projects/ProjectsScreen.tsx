import { Plus } from "lucide-react";

import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import { ProjectBoardSection } from "./board/ProjectBoardSection";
import { useProjectsListPresenter } from "./list/useProjectsListPresenter";

export function ProjectsScreen() {
  const presenter = useProjectsListPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="6xl" spacing="6" className="domain-projects">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            Dirección
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Outcome, próxima acción y foco semanal. Las cards del board son las mismas tasks de siempre.
          </p>
        </div>
        <button type="button" onClick={() => presenter.openForm()} className="btn-primary">
          <Plus size={16} />
          Nuevo proyecto
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {vm.form.isOpen && (
            <form
              className="glass-card-static space-y-3 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void presenter.createProject();
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => presenter.setKind("work")}
                  className={`min-h-10 rounded-full border px-3 text-sm ${
                    vm.form.kind === "work"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                      : "border-[var(--divider)] text-[var(--muted)]"
                  }`}
                >
                  Trabajo
                </button>
                <button
                  type="button"
                  onClick={() => presenter.setKind("personal")}
                  className={`min-h-10 rounded-full border px-3 text-sm ${
                    vm.form.kind === "personal"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                      : "border-[var(--divider)] text-[var(--muted)]"
                  }`}
                >
                  Personal
                </button>
              </div>
              <Input label="Outcome" value={vm.form.outcome} onChange={(value) => presenter.setOutcome(value)} />
              <Input
                label="Próxima acción"
                value={vm.form.nextAction}
                onChange={(value) => presenter.setNextAction(value)}
              />
              <Input label="Foco" value={vm.form.focus} onChange={(value) => presenter.setFocus(value)} />
              <Input label="Cliente" value={vm.form.client} onChange={(value) => presenter.setClient(value)} />
              <div className="flex gap-2">
                <button type="submit" disabled={!vm.form.canSubmit} className="btn-primary flex-1">
                  Crear
                </button>
                <button type="button" onClick={() => presenter.closeForm()} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <section className="glass-card-static overflow-hidden">
            <header className="border-b border-[var(--divider)] p-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Proyectos</h2>
            </header>
            <div className="p-3">
              {vm.error ? (
                <StateCard state="error" size="sm" title="No pudimos cargar proyectos" description={vm.error} />
              ) : vm.isLoading && vm.projects.length === 0 ? (
                <StateCard state="loading" size="sm" skeletonLines={4} />
              ) : vm.projects.length === 0 ? (
                <StateCard size="sm" title="Todavía no hay proyectos" description="Creá uno para darle dirección a tus tasks." />
              ) : (
                <div className="space-y-2">
                  {vm.projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => presenter.selectProject(project.id)}
                      className={`w-full rounded-[var(--radius-md)] border p-3 text-left transition ${
                        project.isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-glow)]"
                          : "border-[var(--divider)] bg-[var(--card)] hover:border-[var(--glass-border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                          {project.kindLabel}
                        </span>
                        <span className="font-data text-[11px] text-[var(--muted)]">{project.statusLabel}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--foreground)]">
                        {project.outcome}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{project.nextAction}</p>
                      {project.clientLabel && (
                        <p className="mt-2 text-[11px] text-[var(--muted)]">{project.clientLabel}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>

        <ProjectBoardSection projectId={vm.selectedProjectId} />
      </div>
    </ModulePage>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
      />
    </label>
  );
}
