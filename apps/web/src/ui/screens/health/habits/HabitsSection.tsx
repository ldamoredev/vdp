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
            Hábitos diarios
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Sostené el día, no la meta
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Binario y sin culpa: se hizo o no se hizo. Las rachas se construyen solas.
          </p>
        </div>
        {vm.showSummary && (
          <div className="shrink-0 text-sm text-[var(--muted)]">
            <span className="font-data text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {vm.completedToday}/{vm.total}
            </span>{" "}
            hoy
          </div>
        )}
      </div>

      <div className="glass-card-static overflow-hidden">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void presenter.createHabit();
          }}
          className="flex items-center gap-2 border-b border-[var(--divider)] p-4"
        >
          <input
            value={vm.newHabitName}
            onChange={(event) => presenter.setNewHabitName(event.target.value)}
            placeholder="Nuevo hábito diario, corto y concreto..."
            disabled={vm.isCreating}
            className="glass-input min-w-0 flex-1 px-3.5 py-2.5 text-sm"
          />
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
