import { Plus, Trash2 } from "lucide-react";

import { StateCard } from "@/ui/primitives/state-card";
import { useTimeTrackingPresenter } from "./useTimeTrackingPresenter";

export function TimeTrackingSection({ projectId }: { projectId: string | null }) {
  const presenter = useTimeTrackingPresenter(projectId);
  const vm = presenter.model;

  if (!projectId) {
    return (
      <section className="glass-card-static p-6">
        <StateCard title="Elegí un proyecto" description="Registrá el tiempo dedicado a un proyecto." />
      </section>
    );
  }

  return (
    <section className="glass-card-static overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--divider)] p-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            Tiempo
          </p>
          <h2 className="mt-1 font-display text-xl font-bold leading-tight text-[var(--foreground)]">
            Registro de horas
          </h2>
        </div>
        <span className="font-data text-sm text-[var(--muted)]">Total · {vm.totalLabel}</span>
      </header>

      <form
        className="flex flex-wrap items-end gap-2 border-b border-[var(--divider)] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.logEntry();
        }}
      >
        <Field label="Fecha">
          <input
            type="date"
            value={vm.form.date}
            onChange={(event) => presenter.setDate(event.target.value)}
            className="min-h-10 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </Field>
        <Field label="Horas">
          <input
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={vm.form.hours}
            onChange={(event) => presenter.setHours(event.target.value)}
            placeholder="1.5"
            className="min-h-10 w-24 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </Field>
        <Field label="Nota" grow>
          <input
            value={vm.form.note}
            onChange={(event) => presenter.setNote(event.target.value)}
            placeholder="Opcional"
            className="min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </Field>
        <button type="submit" disabled={!vm.form.canSubmit} className="btn-primary min-h-10">
          <Plus size={16} />
          Registrar
        </button>
      </form>

      <div className="p-3">
        {vm.error ? (
          <StateCard state="error" size="sm" title="Algo salió mal" description={vm.error} />
        ) : vm.isLoading && vm.entries.length === 0 ? (
          <StateCard state="loading" size="sm" skeletonLines={3} />
        ) : vm.entries.length === 0 ? (
          <StateCard size="sm" title="Sin registros" description="Cargá tu primer bloque de tiempo." />
        ) : (
          <ul className="space-y-1">
            {vm.entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {entry.dateLabel} · {entry.durationLabel}
                  </p>
                  {entry.note && <p className="truncate text-xs text-[var(--muted)]">{entry.note}</p>}
                </div>
                <button
                  type="button"
                  disabled={entry.isBusy}
                  onClick={() => void presenter.deleteEntry(entry.id)}
                  title="Borrar registro"
                  className="text-[var(--muted)] transition hover:text-[var(--danger)] disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Field({ label, grow, children }: { label: string; grow?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${grow ? "min-w-[8rem] flex-1" : ""}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
