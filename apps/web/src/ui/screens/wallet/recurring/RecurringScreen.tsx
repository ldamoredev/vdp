import { Plus, Repeat, Trash2 } from "lucide-react";

import { ModuleHeader } from "@/ui/primitives/module-header";
import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import type { RecurringFormVM, RecurringRowVM } from "@/ui/models/wallet/RecurringViewModel";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { useRecurringPresenter } from "./useRecurringPresenter";

export function RecurringScreen() {
  const presenter = useRecurringPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="5xl" spacing="6">
      <ModuleHeader
        eyebrow="Wallet"
        title={vm.title}
        icon={<Repeat size={20} />}
        description={vm.intro}
        actions={
          <button onClick={() => presenter.toggleForm()} className="btn-primary">
            <Plus size={16} />
            {vm.addButtonLabel}
          </button>
        }
      />

      {vm.form && <RecurringForm vm={vm.form} presenter={presenter} />}

      {vm.isLoading ? (
        <StateCard state="loading" size="lg" className="glass-card-static border-none" aria-label="Cargando reglas" />
      ) : vm.error ? (
        <p className="p-2 text-sm text-[var(--red-soft-text)]">
          No se pudieron cargar las reglas. Probá recargar la página.
        </p>
      ) : vm.isEmpty ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState
            title="Sin gastos recurrentes"
            body="Creá una regla para tus gastos fijos (alquiler, suscripciones) y se cargan solos cada mes."
            ctaLabel="Nueva regla"
            ctaHref="#"
          />
        </div>
      ) : (
        <div className="glass-card-static overflow-hidden">
          {vm.rules.map((rule) => (
            <RecurringRow key={rule.id} vm={rule} presenter={presenter} />
          ))}
        </div>
      )}
    </ModulePage>
  );
}

function RecurringForm({
  vm,
  presenter,
}: {
  vm: RecurringFormVM;
  presenter: ReturnType<typeof useRecurringPresenter>;
}) {
  return (
    <div className="glass-card-static animate-fade-in-up p-5">
      <h3 className="mb-4 text-sm font-semibold">Nueva regla recurrente</h3>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.submit();
        }}
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <select
            value={vm.type}
            onChange={(event) => presenter.setFormField("type", event.target.value)}
            aria-label="Tipo"
            className="glass-input px-4 py-2.5 text-sm"
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>

          <select
            value={vm.accountId}
            onChange={(event) => presenter.setFormField("accountId", event.target.value)}
            aria-label="Cuenta"
            className="glass-input px-4 py-2.5 text-sm"
            required
          >
            <option value="">Elegí una cuenta</option>
            {vm.accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={vm.categoryId}
            onChange={(event) => presenter.setFormField("categoryId", event.target.value)}
            aria-label="Categoría"
            className="glass-input px-4 py-2.5 text-sm"
          >
            <option value="">Sin categoría</option>
            {vm.categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={vm.amount}
            onChange={(event) => presenter.setFormField("amount", event.target.value)}
            placeholder="Monto"
            aria-label="Monto"
            className="glass-input px-4 py-2.5 text-sm font-data"
            required
          />
        </div>

        <input
          value={vm.description}
          onChange={(event) => presenter.setFormField("description", event.target.value)}
          placeholder="Descripción (ej: Alquiler, Netflix)"
          aria-label="Descripción"
          className="glass-input w-full px-4 py-2.5 text-sm"
        />

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-[var(--foreground-muted)]">
            Día del mes
            <input
              type="number"
              min="1"
              max="31"
              value={vm.dayOfMonth}
              onChange={(event) => presenter.setFormField("dayOfMonth", event.target.value)}
              className="glass-input px-4 py-2.5 text-sm font-data"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--foreground-muted)]">
            Desde
            <input
              type="date"
              value={vm.startDate}
              onChange={(event) => presenter.setFormField("startDate", event.target.value)}
              className="glass-input px-4 py-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--foreground-muted)]">
            Hasta (opcional)
            <input
              type="date"
              value={vm.endDate}
              onChange={(event) => presenter.setFormField("endDate", event.target.value)}
              className="glass-input px-4 py-2.5 text-sm"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={!vm.canSubmit}>
            {vm.submitLabel}
          </button>
          <button type="button" onClick={() => presenter.toggleForm()} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function RecurringRow({
  vm,
  presenter,
}: {
  vm: RecurringRowVM;
  presenter: ReturnType<typeof useRecurringPresenter>;
}) {
  const tone = vm.toneIsExpense ? "text-[var(--accent-red)]" : "text-[var(--accent-green)]";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--divider)] p-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
          <Repeat size={16} className="text-[var(--accent)]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[var(--foreground)]">{vm.title}</div>
          <div className="truncate text-xs text-[var(--muted)]">
            {vm.scheduleLabel}
            {vm.metaLabel ? ` · ${vm.metaLabel}` : ""}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className={`text-sm font-data font-semibold tabular-nums ${tone}`}>{vm.amountLabel}</span>
        <button
          onClick={() => void presenter.deleteRule(vm.id)}
          disabled={vm.isBusy}
          aria-label="Eliminar regla"
          className="rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-red-glow)] hover:text-[var(--accent-red)] disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
