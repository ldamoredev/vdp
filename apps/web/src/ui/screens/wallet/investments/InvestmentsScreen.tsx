import { Plus, TrendingDown, TrendingUp } from "lucide-react";

import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import type {
  InvestmentFormVM,
  InvestmentItemVM,
  InvestmentSummaryVM,
} from "@/ui/models/wallet/InvestmentsViewModel";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { useInvestmentsPresenter } from "./useInvestmentsPresenter";

export function InvestmentsScreen() {
  const presenter = useInvestmentsPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="5xl" spacing="6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{vm.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{vm.intro}</p>
        </div>
        <button onClick={() => presenter.toggleForm()} className="btn-primary">
          <Plus size={16} />
          {vm.addButtonLabel}
        </button>
      </div>

      {vm.summaries.map((summary) => (
        <InvestmentSummary key={summary.currency} vm={summary} />
      ))}

      {vm.form && <InvestmentForm vm={vm.form} presenter={presenter} />}

      {vm.isLoading ? (
        <StateCard
          state="loading"
          size="lg"
          className="glass-card-static border-none"
          aria-label="Cargando inversiones"
        />
      ) : vm.emptyState ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState {...vm.emptyState} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          {vm.investments.map((investment) => (
            <InvestmentCard key={investment.id} vm={investment} presenter={presenter} />
          ))}
        </div>
      )}
    </ModulePage>
  );
}

function InvestmentSummary({ vm }: { vm: InvestmentSummaryVM }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
      <div className="glass-card-static p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Total invertido · {vm.currency}
        </span>
        <div className="mt-2 text-xl font-bold tracking-tight">{vm.totalInvestedLabel}</div>
      </div>
      <div className="glass-card-static p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Valor actual · {vm.currency}
        </span>
        <div className="mt-2 text-xl font-bold tracking-tight">{vm.totalCurrentLabel}</div>
      </div>
      <div className={`glass-card-static p-5 ${vm.positive ? "glow-green" : "glow-red"}`}>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Retorno total · {vm.currency}
        </span>
        <div
          className={`mt-2 flex items-center gap-2 text-xl font-bold tracking-tight ${
            vm.positive ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
          }`}
        >
          {vm.positive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          {vm.totalReturnLabel}
        </div>
      </div>
    </div>
  );
}

function InvestmentForm({
  vm,
  presenter,
}: {
  vm: InvestmentFormVM;
  presenter: ReturnType<typeof useInvestmentsPresenter>;
}) {
  return (
    <div className="glass-card-static animate-fade-in-up p-5">
      <h3 className="mb-4 text-sm font-semibold">Nueva inversion</h3>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.submit();
        }}
      >
        <input
          value={vm.name}
          onChange={(event) => presenter.setFormField("name", event.target.value)}
          placeholder="Ej: FCI liquidez"
          className="glass-input w-full px-4 py-2.5 text-sm"
          required
        />

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            value={vm.type}
            onChange={(event) => presenter.setFormField("type", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
          >
            {vm.typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={vm.accountId}
            onChange={(event) => presenter.setFormField("accountId", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
          >
            {vm.accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={vm.currency}
            onChange={(event) => presenter.setFormField("currency", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
          >
            {vm.currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            type="number"
            step="0.01"
            value={vm.investedAmount}
            onChange={(event) => presenter.setFormField("investedAmount", event.target.value)}
            placeholder="Monto invertido"
            className="glass-input px-4 py-2.5 text-sm"
            required
          />
          <input
            type="number"
            step="0.01"
            value={vm.currentValue}
            onChange={(event) => presenter.setFormField("currentValue", event.target.value)}
            placeholder="Valor actual"
            className="glass-input px-4 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            type="date"
            value={vm.startDate}
            onChange={(event) => presenter.setFormField("startDate", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
            required
          />
          <input
            type="date"
            value={vm.endDate}
            onChange={(event) => presenter.setFormField("endDate", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
          />
          <input
            type="number"
            step="0.0001"
            value={vm.rate}
            onChange={(event) => presenter.setFormField("rate", event.target.value)}
            placeholder="Tasa"
            className="glass-input px-4 py-2.5 text-sm"
          />
        </div>

        <textarea
          value={vm.notes}
          onChange={(event) => presenter.setFormField("notes", event.target.value)}
          placeholder="Notas opcionales"
          className="glass-input min-h-24 w-full px-4 py-2.5 text-sm"
        />

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

function InvestmentCard({
  vm,
  presenter,
}: {
  vm: InvestmentItemVM;
  presenter: ReturnType<typeof useInvestmentsPresenter>;
}) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">{vm.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{vm.typeLabel}</p>
        </div>
        <span className={`badge ${vm.positive ? "badge-green" : "badge-red"}`}>{vm.returnLabel}</span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Invertido</span>
          <span className="font-medium">{vm.investedLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Actual</span>
          <span className="font-medium">{vm.currentLabel}</span>
        </div>
      </div>

      {vm.isEditing ? (
        <form
          className="mt-4 space-y-3 border-t border-[var(--glass-border)] pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void presenter.saveEdit();
          }}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Valor actual
              </label>
              <input
                type="number"
                step="0.01"
                value={vm.editingCurrentValue}
                onChange={(event) => presenter.setEditField("currentValue", event.target.value)}
                className="glass-input w-full px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Tasa
              </label>
              <input
                type="number"
                step="0.0001"
                value={vm.editingRate}
                onChange={(event) => presenter.setEditField("rate", event.target.value)}
                placeholder="Opcional"
                className="glass-input w-full px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Notas
            </label>
            <textarea
              value={vm.editingNotes}
              onChange={(event) => presenter.setEditField("notes", event.target.value)}
              placeholder="Notas opcionales sobre la valuacion"
              className="glass-input min-h-24 w-full px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={!vm.canSubmitEdit}>
              {vm.isSubmittingEdit ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => presenter.cancelEdit()}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          {vm.notes && (
            <p className="mt-4 border-t border-[var(--glass-border)] pt-4 text-xs text-[var(--muted)]">
              {vm.notes}
            </p>
          )}

          <div className="mt-4 flex gap-2 border-t border-[var(--glass-border)] pt-4">
            <button
              onClick={() => presenter.startEdit(vm.id)}
              className="btn-secondary px-3 py-1.5 text-xs"
              disabled={vm.isSubmittingEdit}
            >
              Editar valuacion
            </button>
          </div>
        </>
      )}
    </div>
  );
}
