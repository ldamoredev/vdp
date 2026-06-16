import { HeartPulse, Plus } from "lucide-react";

import { HabitRow } from "./HabitRow";
import { useHabitsPresenter } from "./useHabitsPresenter";

export function HabitsSection() {
  const presenter = useHabitsPresenter();
  const vm = presenter.model;

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
            <HeartPulse size={11} />
            Hábitos
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Sostené el día, no la meta
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Diarios o semanales, binarios y sin culpa. Las rachas se construyen solas.
          </p>
        </div>
        {vm.showSummary && (
          <div className="shrink-0 text-sm text-[var(--muted)]">
            <span className="font-data text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {vm.inRhythm}/{vm.total}
            </span>{" "}
            en ritmo
          </div>
        )}
      </div>

      <div className="glass-card-static overflow-hidden">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void presenter.createHabit();
          }}
          className="grid grid-cols-1 gap-2 border-b border-[var(--divider)] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
        >
          <input
            value={vm.newHabitName}
            onChange={(event) => presenter.setNewHabitName(event.target.value)}
            placeholder="Nuevo hábito, corto y concreto..."
            disabled={vm.isCreating}
            className="glass-input min-w-0 flex-1 px-3.5 py-2.5 text-sm"
          />
          <div className="inline-flex rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-1">
            <button
              type="button"
              onClick={() => presenter.setNewHabitCadence("daily")}
              disabled={vm.isCreating}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                vm.newHabitCadence === "daily"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Diario
            </button>
            <button
              type="button"
              onClick={() => presenter.setNewHabitCadence("weekly")}
              disabled={vm.isCreating}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                vm.newHabitCadence === "weekly"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Semanal
            </button>
          </div>
          {vm.showWeeklyTarget && (
            <select
              value={vm.newHabitWeeklyTarget}
              onChange={(event) => presenter.setNewHabitWeeklyTarget(Number(event.target.value))}
              disabled={vm.isCreating}
              aria-label="Veces por semana"
              className="glass-input px-3 py-2.5 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <option key={value} value={value}>
                  {value}/sem
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={!vm.canCreate}
            aria-label="Crear hábito"
            className="btn-primary shrink-0 p-2.5 disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
        </form>

        <div className="space-y-2.5 p-4">
          {vm.isLoading && (
            <div className="space-y-2.5">
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
            </div>
          )}

          {vm.error && !vm.isLoading && (
            <p className="p-2 text-sm text-[var(--red-soft-text)]">
              No se pudieron cargar los hábitos. Probá recargar la página.
            </p>
          )}

          {!vm.isLoading && !vm.error && vm.habits.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">Todavía no hay hábitos</p>
              <p className="mx-auto mt-1 max-w-[300px] text-xs leading-relaxed text-[var(--muted)]">
                Empezá con uno solo — el que harías aunque el día venga mal.
              </p>
            </div>
          )}

          {vm.habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              onToggle={(id) => void presenter.toggle(id)}
              onArchive={(id) => void presenter.archive(id)}
            />
          ))}

          {vm.allDone && (
            <p className="pt-2 text-center text-xs text-[var(--emerald-soft-text)]">
              Día completo. Nada más que sostener por hoy.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
