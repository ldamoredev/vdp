import { Plus, Scale } from "lucide-react";

import { useWeightPresenter } from "./useWeightPresenter";

export function WeightSection() {
  const presenter = useWeightPresenter();
  const vm = presenter.model;

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--divider)] p-4">
        <Scale size={16} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">Peso corporal</h3>
        <span className="ml-auto text-xs text-[var(--muted)]">Una medida por día, tendencia suave</span>
      </div>

      <div className="grid gap-4 border-b border-[var(--divider)] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="font-data text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {vm.currentWeightLabel}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            <span className="font-data font-semibold text-[var(--foreground)]">{vm.changeLabel}</span>{" "}
            en {vm.rangeLabel}
          </div>
        </div>

        <div className="min-h-12 min-w-[160px]">
          {vm.sparkline ? (
            <div className="flex items-center gap-2">
              <div className="font-data flex flex-col justify-between self-stretch text-[10px] text-[var(--muted)]">
                <span>{vm.sparkline.maxLabel}</span>
                <span>{vm.sparkline.minLabel}</span>
              </div>
              <svg viewBox="0 0 120 36" className="h-12 w-36 overflow-visible" aria-hidden="true">
                <polyline
                  points={vm.sparkline.points}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div className="flex h-12 items-center justify-end text-xs text-[var(--muted)]">
              Todavía no hay curva
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.save();
        }}
        className="grid grid-cols-1 gap-2 border-b border-[var(--divider)] p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={vm.newWeight}
          onChange={(event) => presenter.setNewWeight(event.target.value)}
          placeholder="Peso kg"
          inputMode="decimal"
          disabled={vm.isSaving}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm font-data"
        />
        <input
          type="date"
          value={vm.newDate}
          onChange={(event) => presenter.setNewDate(event.target.value)}
          aria-label="Fecha del peso"
          disabled={vm.isSaving}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={!vm.canSave}
          aria-label="Guardar peso"
          className="btn-primary justify-center p-2.5 disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </form>

      <div className="space-y-2.5 p-4">
        {vm.isLoading && <div className="skeleton h-16 w-full" />}

        {vm.error && !vm.isLoading && (
          <p className="p-2 text-sm text-[var(--red-soft-text)]">
            No se pudo cargar la tendencia de peso. Probá recargar la página.
          </p>
        )}

        {!vm.isLoading && !vm.error && vm.entries.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--muted)]">
            Registrá el primer peso para empezar a ver tendencia.
          </p>
        )}

        {vm.entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] px-4 py-2.5"
          >
            <span className="text-xs text-[var(--muted)]">{entry.dateLabel}</span>
            <span className="font-data text-sm font-semibold text-[var(--foreground)]">{entry.weightLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
