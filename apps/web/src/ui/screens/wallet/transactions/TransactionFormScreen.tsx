import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import { ModulePage } from "@/ui/primitives/module-page";
import type { TransactionFormViewModel } from "@/ui/models/wallet/TransactionsViewModel";
import { useTransactionFormPresenter } from "./useTransactionFormPresenter";

export function TransactionFormScreen() {
  const navigate = useNavigate();
  const presenter = useTransactionFormPresenter();
  const vm = presenter.model;

  useEffect(() => {
    if (vm.didSubmit) navigate("/wallet/transactions");
  }, [navigate, vm.didSubmit]);

  return (
    <ModulePage width="lg" spacing="6">
      <Link
        to={vm.backHref}
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={16} />
        {vm.backLabel}
      </Link>

      <div className="glass-card-static p-6">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">{vm.title}</h2>
        <p className="-mt-3 mb-6 text-sm text-[var(--muted)]">{vm.intro}</p>
        <TransactionForm vm={vm} presenter={presenter} />
      </div>
    </ModulePage>
  );
}

function TransactionForm({
  vm,
  presenter,
}: {
  vm: TransactionFormViewModel;
  presenter: ReturnType<typeof useTransactionFormPresenter>;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void presenter.submit();
      }}
      className="space-y-5"
    >
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Tipo
        </label>
        <div className="flex gap-2">
          {vm.typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => presenter.setFormField("type", option.value)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                vm.form.type === option.value
                  ? option.tone === "expense"
                    ? "bg-[var(--accent-red)] text-white shadow-lg shadow-red-500/20"
                    : option.tone === "income"
                      ? "bg-[var(--accent-green)] text-white shadow-lg shadow-green-500/20"
                      : "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                  : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Monto
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={vm.form.amount}
            onChange={(event) => presenter.setFormField("amount", event.target.value)}
            className="glass-input flex-1 px-4 py-2.5 text-sm font-data"
            required
          />
          <select
            value={vm.form.currency}
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
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Cuenta
        </label>
        <select
          value={vm.form.accountId}
          onChange={(event) => presenter.setFormField("accountId", event.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        >
          <option value="">Seleccionar cuenta</option>
          {vm.accounts.map((account) => (
            <option key={account.value} value={account.value}>
              {account.label}
            </option>
          ))}
        </select>
      </div>

      {vm.form.showCategory && (
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
            Categoria
          </label>
          <select
            value={vm.form.categoryId}
            onChange={(event) => presenter.setFormField("categoryId", event.target.value)}
            className="glass-input w-full px-4 py-2.5 text-sm"
          >
            <option value="">Sin categoria</option>
            {vm.categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Descripcion
        </label>
        <input
          type="text"
          placeholder="Ej: Almuerzo con amigos"
          value={vm.form.description}
          onChange={(event) => presenter.setFormField("description", event.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Fecha
        </label>
        <input
          type="date"
          value={vm.form.date}
          onChange={(event) => presenter.setFormField("date", event.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Tags
        </label>
        <input
          type="text"
          placeholder="Separados por coma"
          value={vm.form.tags}
          onChange={(event) => presenter.setFormField("tags", event.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={vm.isSubmitting}
          className="btn-primary flex-1 justify-center"
        >
          {vm.isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {vm.submitLabel}
            </>
          ) : (
            vm.submitLabel
          )}
        </button>
        <Link to={vm.backHref} className="btn-secondary">
          Cancelar
        </Link>
      </div>

      {vm.errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-[var(--accent-red-glow)] p-3">
          <p className="text-sm text-[var(--accent-red)]">{vm.errorMessage}</p>
        </div>
      )}
    </form>
  );
}
