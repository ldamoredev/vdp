import { Check, Flag, Plus, Sparkles, X } from "lucide-react";

import type { GoalUrgency } from "@/core/domain/health/Goal";
import type { GoalsPresenter } from "./GoalsPresenter";
import { useGoalsPresenter } from "./useGoalsPresenter";

function urgencyClassName(urgency: GoalUrgency) {
  switch (urgency) {
    case "overdue":
      return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]";
    case "soon":
      return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]";
    case "calm":
      return "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)]";
  }
}

function GraduationBanner({ presenter }: { presenter: GoalsPresenter }) {
  const graduation = presenter.model.graduation;
  if (!graduation) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Sparkles size={14} className="shrink-0 text-[var(--violet-soft-text)]" />
        <span className="text-xs leading-relaxed text-[var(--foreground)]">
          Meta cumplida. ¿La convertimos en hábito diario para que se quede ganada?
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          value={graduation.habitName}
          onChange={(event) => presenter.setGraduationHabitName(event.target.value)}
          disabled={graduation.isGraduating}
          aria-label="Nombre del hábito"
          className="glass-input w-44 px-3 py-1.5 text-xs"
        />
        <button
          type="button"
          onClick={() => void presenter.graduate()}
          disabled={!graduation.habitName.trim() || graduation.isGraduating}
          className="btn-primary px-3 py-1.5 text-xs disabled:opacity-30"
        >
          {graduation.isGraduating ? "Creando..." : "Crear hábito"}
        </button>
        <button
          type="button"
          onClick={() => presenter.dismissGraduation()}
          aria-label="Descartar"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

export function GoalsSection() {
  const presenter = useGoalsPresenter();
  const vm = presenter.model;

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--divider)] p-4">
        <Flag size={16} style={{ color: "var(--amber-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">Metas con fecha límite</h3>
        <span className="ml-auto text-xs text-[var(--muted)]">
          Cumplida, arrancada o soltada — que no venza sola
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.create();
        }}
        className="grid grid-cols-1 gap-2 border-b border-[var(--divider)] p-4 sm:grid-cols-[2fr_1fr_auto]"
      >
        <input
          value={vm.newTitle}
          onChange={(event) => presenter.setNewTitle(event.target.value)}
          placeholder='Meta, ej: "Empezar el gym"'
          disabled={vm.isCreating}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <input
          type="date"
          value={vm.newTargetDate}
          onChange={(event) => presenter.setNewTargetDate(event.target.value)}
          aria-label="Fecha límite"
          disabled={vm.isCreating}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={!vm.canCreate}
          aria-label="Crear meta"
          className="btn-primary justify-center p-2.5 disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </form>

      <div className="space-y-2.5 p-4">
        <GraduationBanner presenter={presenter} />

        {vm.isLoading && <div className="skeleton h-14 w-full" />}

        {vm.error && !vm.isLoading && (
          <p className="p-2 text-sm text-[var(--red-soft-text)]">
            No se pudieron cargar las metas. Probá recargar la página.
          </p>
        )}

        {!vm.isLoading && !vm.error && vm.goals.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">Sin metas abiertas</p>
            <p className="mx-auto mt-1 max-w-[320px] text-xs leading-relaxed text-[var(--muted)]">
              Una meta es un resultado con fecha: empezar el gym, arrancar la dieta. Cuando se
              cumple, se convierte en hábito.
            </p>
          </div>
        )}

        {vm.goals.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] px-4 py-3 transition-all hover:bg-[var(--hover-overlay)]"
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-[var(--foreground)]">{goal.title}</span>
              <div className="mt-0.5 text-[11px] text-[var(--muted)]">{goal.targetDateLabel}</div>
            </div>

            <span
              className={`font-data shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold ${urgencyClassName(goal.urgency)}`}
            >
              {goal.deadlineLabel}
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => void presenter.complete(goal.id)}
                disabled={goal.busy}
                title="Marcar como cumplida"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-all hover:scale-105 disabled:opacity-50"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => void presenter.drop(goal.id)}
                disabled={goal.busy}
                title="Soltar la meta"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
