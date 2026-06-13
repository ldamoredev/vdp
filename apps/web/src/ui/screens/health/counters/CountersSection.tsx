import { Plus, TimerReset } from "lucide-react";

import { CounterCard } from "./CounterCard";
import { useCountersPresenter } from "./useCountersPresenter";

export function CountersSection() {
  const presenter = useCountersPresenter();
  const vm = presenter.model;

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--divider)] p-4">
        <TimerReset size={16} style={{ color: "var(--emerald-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">Días sin / desde</h3>
        <span className="ml-auto text-xs text-[var(--muted)]">
          Corren solos — solo registrá si recaés
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.create();
        }}
        className="grid grid-cols-1 gap-2 border-b border-[var(--divider)] p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
      >
        <input
          value={vm.newName}
          onChange={(event) => presenter.setNewName(event.target.value)}
          placeholder='Contador, ej: "Sin fumar"'
          disabled={vm.isCreating}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <input
          value={vm.newDailyCost}
          onChange={(event) => presenter.setNewDailyCost(event.target.value)}
          placeholder="Costo diario ARS (opc.)"
          inputMode="decimal"
          disabled={vm.isCreating}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <input
          type="date"
          value={vm.newStartedAt}
          onChange={(event) => presenter.setNewStartedAt(event.target.value)}
          aria-label="Fecha de inicio (opcional, default hoy)"
          disabled={vm.isCreating}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={!vm.canCreate}
          aria-label="Crear contador"
          className="btn-primary justify-center p-2.5 disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </form>

      <div className="space-y-2.5 p-4">
        {vm.isLoading && <div className="skeleton h-20 w-full" />}

        {vm.error && !vm.isLoading && (
          <p className="p-2 text-sm text-[var(--red-soft-text)]">
            No se pudieron cargar los contadores. Probá recargar la página.
          </p>
        )}

        {!vm.isLoading && !vm.error && vm.counters.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">Sin contadores todavía</p>
            <p className="mx-auto mt-1 max-w-[320px] text-xs leading-relaxed text-[var(--muted)]">
              Para lo que dejaste o empezaste: días sin fumar, días desde el último X. Con costo
              diario, además calcula la plata que no se fue.
            </p>
          </div>
        )}

        {vm.counters.map((counter) => (
          <CounterCard
            key={counter.id}
            counter={counter}
            onRelapse={(id) => presenter.requestRelapse(id)}
            onArchive={(id) => void presenter.archive(id)}
          />
        ))}
      </div>
    </div>
  );
}
