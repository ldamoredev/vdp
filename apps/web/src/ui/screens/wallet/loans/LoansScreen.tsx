import { HandCoins, Plus } from "lucide-react";

import { ModuleHeader } from "@/ui/primitives/module-header";
import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import type { LoanCardVM, LoanFormVM, LoanSummaryVM } from "@/ui/models/wallet/LoansViewModel";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { useLoansPresenter } from "./useLoansPresenter";

export function LoansScreen() {
  const presenter = useLoansPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="4xl" spacing="6">
      <ModuleHeader
        eyebrow="Wallet"
        title={vm.title}
        icon={<HandCoins size={20} />}
        description={vm.intro}
        actions={
          <button onClick={() => presenter.toggleForm()} className="btn-primary">
            <Plus size={16} />
            {vm.addButtonLabel}
          </button>
        }
      />

      {vm.summary.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vm.summary.map((entry) => (
            <SummaryCard key={entry.currency} vm={entry} />
          ))}
        </div>
      )}

      {vm.form && <LoanForm vm={vm.form} presenter={presenter} />}

      {vm.isLoading ? (
        <StateCard state="loading" size="lg" className="glass-card-static border-none" aria-label="Cargando préstamos" />
      ) : vm.emptyState ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState {...vm.emptyState} />
        </div>
      ) : (
        <div className="space-y-6">
          {vm.openLoans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Abiertos</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
                {vm.openLoans.map((loan) => (
                  <LoanCard key={loan.id} vm={loan} presenter={presenter} />
                ))}
              </div>
            </section>
          )}

          {vm.closedLoans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--muted)]">Cerrados</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {vm.closedLoans.map((loan) => (
                  <LoanCard key={loan.id} vm={loan} presenter={presenter} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </ModulePage>
  );
}

function SummaryCard({ vm }: { vm: LoanSummaryVM }) {
  return (
    <div className="glass-card-static p-4">
      <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
        {vm.currency}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[var(--muted)]">Te deben</span>
        <span className="font-data font-semibold text-[var(--foreground)]">{vm.lentLabel}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[var(--muted)]">Debés</span>
        <span className="font-data font-semibold text-[var(--foreground)]">{vm.borrowedLabel}</span>
      </div>
    </div>
  );
}

function LoanForm({
  vm,
  presenter,
}: {
  vm: LoanFormVM;
  presenter: ReturnType<typeof useLoansPresenter>;
}) {
  return (
    <div className="glass-card-static animate-fade-in-up p-5">
      <h3 className="mb-4 text-sm font-semibold">Registrar préstamo</h3>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.submit();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => presenter.setDirection("lent")}
            className={`min-h-10 rounded-full border px-3 text-sm ${
              vm.direction === "lent"
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "border-[var(--divider)] text-[var(--muted)]"
            }`}
          >
            Presté
          </button>
          <button
            type="button"
            onClick={() => presenter.setDirection("borrowed")}
            className={`min-h-10 rounded-full border px-3 text-sm ${
              vm.direction === "borrowed"
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "border-[var(--divider)] text-[var(--muted)]"
            }`}
          >
            Me prestaron
          </button>
        </div>

        <input
          value={vm.counterparty}
          onChange={(event) => presenter.setFormField("counterparty", event.target.value)}
          placeholder="¿A quién? (ej: Marco)"
          className="glass-input w-full px-4 py-2.5 text-sm"
          required
        />

        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={vm.principal}
            onChange={(event) => presenter.setFormField("principal", event.target.value)}
            placeholder="Monto"
            className="glass-input flex-1 px-4 py-2.5 text-sm font-data"
            required
          />
          <select
            value={vm.currency}
            onChange={(event) => presenter.setFormCurrency(event.target.value as "ARS" | "USD")}
            className="glass-input px-4 py-2.5 text-sm"
          >
            {vm.currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <label className="flex-1 text-xs text-[var(--muted)]">
            Fecha
            <input
              type="date"
              value={vm.date}
              onChange={(event) => presenter.setFormField("date", event.target.value)}
              className="glass-input mt-1 w-full px-4 py-2.5 text-sm"
              required
            />
          </label>
          <label className="flex-1 text-xs text-[var(--muted)]">
            Vencimiento (opcional)
            <input
              type="date"
              value={vm.dueDate}
              onChange={(event) => presenter.setFormField("dueDate", event.target.value)}
              className="glass-input mt-1 w-full px-4 py-2.5 text-sm"
            />
          </label>
        </div>

        <input
          value={vm.note}
          onChange={(event) => presenter.setFormField("note", event.target.value)}
          placeholder="Nota (opcional)"
          className="glass-input w-full px-4 py-2.5 text-sm"
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

function LoanCard({
  vm,
  presenter,
}: {
  vm: LoanCardVM;
  presenter: ReturnType<typeof useLoansPresenter>;
}) {
  return (
    <div className={`glass-card p-5 ${vm.isOpen ? "" : "opacity-70"}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            {vm.directionLabel}
          </p>
          <h3 className="truncate font-medium text-[var(--foreground)]">{vm.counterparty}</h3>
        </div>
        <span className={`badge ${vm.isOpen ? "" : "badge-green"}`}>{vm.statusLabel}</span>
      </div>

      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-lg font-bold tracking-tight font-data">{vm.outstandingLabel}</span>
        <span className="text-xs text-[var(--muted)]">de {vm.principalLabel}</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
        <span>{vm.dateLabel}</span>
        {vm.dueLabel && <span>· Vence {vm.dueLabel}</span>}
        {vm.paymentsLabel && <span>· {vm.paymentsLabel}</span>}
      </div>
      {vm.note && <p className="mb-3 text-xs text-[var(--muted)]">{vm.note}</p>}

      {vm.isOpen &&
        (vm.isPaying ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void presenter.submitPayment();
            }}
          >
            <input
              type="number"
              step="0.01"
              min="0"
              value={vm.paymentAmount}
              onChange={(event) => presenter.setPaymentAmount(event.target.value)}
              placeholder="Monto"
              className="glass-input w-28 px-3 py-2 text-sm font-data"
              required
            />
            <button type="submit" className="btn-primary px-3 py-2 text-sm" disabled={!vm.canSubmitPayment}>
              {vm.isSubmittingPayment ? "..." : "Registrar"}
            </button>
            <button
              type="button"
              onClick={() => presenter.cancelPayment()}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => presenter.startPayment(vm.id)}
              disabled={vm.isBusy}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Registrar pago
            </button>
            <button
              onClick={() => void presenter.markRepaid(vm.id)}
              disabled={vm.isBusy}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Saldar
            </button>
            <button
              onClick={() => void presenter.forgive(vm.id)}
              disabled={vm.isBusy}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Perdonar
            </button>
          </div>
        ))}
    </div>
  );
}
