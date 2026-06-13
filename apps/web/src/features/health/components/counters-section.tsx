import { Plus, TimerReset } from "lucide-react";
import { useHealthData, useHealthActions } from "../use-health-context";
import { CounterCard } from "./counter-card";

export function CountersSection() {
  const {
    counters,
    isLoadingCounters,
    countersError,
    newCounterName,
    newCounterDailyCost,
    newCounterStartedAt,
    isCreatingCounter,
  } = useHealthData();
  const {
    setNewCounterName,
    setNewCounterDailyCost,
    setNewCounterStartedAt,
    createCounter,
    relapseCounter,
    archiveCounter,
    isCounterBusy,
  } = useHealthActions();

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
        onSubmit={createCounter}
        className="grid grid-cols-1 gap-2 border-b border-[var(--divider)] p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
      >
        <input
          value={newCounterName}
          onChange={(event) => setNewCounterName(event.target.value)}
          placeholder='Contador, ej: "Sin fumar"'
          disabled={isCreatingCounter}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <input
          value={newCounterDailyCost}
          onChange={(event) => setNewCounterDailyCost(event.target.value)}
          placeholder="Costo diario ARS (opc.)"
          inputMode="decimal"
          disabled={isCreatingCounter}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <input
          type="date"
          value={newCounterStartedAt}
          onChange={(event) => setNewCounterStartedAt(event.target.value)}
          aria-label="Fecha de inicio (opcional, default hoy)"
          disabled={isCreatingCounter}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={!newCounterName.trim() || isCreatingCounter}
          aria-label="Crear contador"
          className="btn-primary justify-center p-2.5 disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </form>

      <div className="space-y-2.5 p-4">
        {isLoadingCounters && <div className="skeleton h-20 w-full" />}

        {countersError && !isLoadingCounters && (
          <p className="p-2 text-sm text-[var(--red-soft-text)]">
            No se pudieron cargar los contadores. Probá recargar la página.
          </p>
        )}

        {!isLoadingCounters && !countersError && counters.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Sin contadores todavía
            </p>
            <p className="mx-auto mt-1 max-w-[320px] text-xs leading-relaxed text-[var(--muted)]">
              Para lo que dejaste o empezaste: días sin fumar, días desde el
              último X. Con costo diario, además calcula la plata que no se fue.
            </p>
          </div>
        )}

        {counters.map((counter) => (
          <CounterCard
            key={counter.id}
            counter={counter}
            busy={isCounterBusy(counter.id)}
            onRelapse={relapseCounter}
            onArchive={archiveCounter}
          />
        ))}
      </div>
    </div>
  );
}
