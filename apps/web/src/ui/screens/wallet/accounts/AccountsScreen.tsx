import { PencilLine, Plus, Trash2, Wallet2 } from "lucide-react";

import { ModuleHeader } from "@/ui/primitives/module-header";
import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import type { AccountFormVM, AccountItemVM } from "@/ui/models/wallet/AccountsViewModel";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { useAccountsPresenter } from "./useAccountsPresenter";

export function AccountsScreen() {
  const presenter = useAccountsPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="5xl" spacing="6">
      <ModuleHeader
        eyebrow="Wallet"
        title={vm.title}
        icon={<Wallet2 size={20} />}
        description={vm.intro}
        actions={
          <button onClick={() => presenter.toggleForm()} className="btn-primary">
            <Plus size={16} />
            {vm.addButtonLabel}
          </button>
        }
      />

      {vm.form && <AccountForm vm={vm.form} presenter={presenter} />}

      {vm.isLoading ? (
        <StateCard
          state="loading"
          size="lg"
          className="glass-card-static border-none"
          aria-label="Cargando cuentas"
        />
      ) : vm.emptyState ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState {...vm.emptyState} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          {vm.accounts.map((account) => (
            <AccountCard key={account.id} vm={account} presenter={presenter} />
          ))}
        </div>
      )}
    </ModulePage>
  );
}

function AccountForm({
  vm,
  presenter,
}: {
  vm: AccountFormVM;
  presenter: ReturnType<typeof useAccountsPresenter>;
}) {
  return (
    <div className="glass-card-static animate-fade-in-up p-5">
      <h3 className="mb-4 text-sm font-semibold">Crear cuenta</h3>
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
          placeholder="Ej: Brubank, Efectivo, Binance"
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

          <input
            type="number"
            step="0.01"
            value={vm.initialBalance}
            onChange={(event) => presenter.setFormField("initialBalance", event.target.value)}
            placeholder="Saldo inicial"
            className="glass-input px-4 py-2.5 text-sm"
          />
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

function AccountCard({
  vm,
  presenter,
}: {
  vm: AccountItemVM;
  presenter: ReturnType<typeof useAccountsPresenter>;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
            <Wallet2 size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            {vm.isEditing ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void presenter.saveEdit();
                }}
              >
                <input
                  value={vm.editingName}
                  onChange={(event) => presenter.setEditingName(event.target.value)}
                  className="glass-input px-3 py-1.5 text-sm"
                  required
                />
                <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={vm.isBusy}>
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => presenter.cancelEdit()}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <h3 className="font-medium">{vm.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{vm.metaLabel}</p>
              </>
            )}
          </div>
        </div>

        {!vm.isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => presenter.startEdit(vm.id, vm.name)}
              className="rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
            >
              <PencilLine size={16} />
            </button>
            <button
              onClick={() => void presenter.deleteAccount(vm.id)}
              disabled={vm.isBusy}
              className="rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-red-glow)] hover:text-[var(--accent-red)]"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3.5">
          <p className="text-xs uppercase tracking-wider text-[var(--foreground-muted)]">Balance actual</p>
          <p className="mt-1.5 truncate text-lg font-bold tracking-tight tabular-nums">
            {vm.currentBalanceLabel}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3.5">
          <p className="text-xs uppercase tracking-wider text-[var(--foreground-muted)]">Saldo inicial</p>
          <p className="mt-1.5 truncate text-lg font-bold tracking-tight tabular-nums">
            {vm.initialBalanceLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
