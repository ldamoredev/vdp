import { useEffect } from "react";
import { X } from "lucide-react";

import type { QuickAddExpenseViewModel } from "@/ui/models/wallet/TransactionsViewModel";
import { useQuickAddExpensePresenter } from "./useQuickAddExpensePresenter";

interface QuickAddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function QuickAddExpenseSheet({ open, onClose, onSaved }: QuickAddExpenseSheetProps) {
  const presenter = useQuickAddExpensePresenter();
  const vm = presenter.model;

  useEffect(() => {
    if (!open) presenter.reset();
  }, [open, presenter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={vm.title}
    >
      <div
        className="glass-card-static w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{vm.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <QuickAddForm vm={vm} presenter={presenter} onClose={onClose} onSaved={onSaved} />
      </div>
    </div>
  );
}

function QuickAddForm({
  vm,
  presenter,
  onClose,
  onSaved,
}: {
  vm: QuickAddExpenseViewModel;
  presenter: ReturnType<typeof useQuickAddExpensePresenter>;
  onClose: () => void;
  onSaved?: () => void;
}) {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await presenter.submit();
        if (ok) {
          onSaved?.();
          onClose();
        }
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Monto ({vm.form.currency})
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={vm.form.amount}
          onChange={(event) => presenter.setAmount(event.target.value)}
          className="glass-input w-full px-4 py-3 text-2xl font-data font-semibold"
          required
          autoFocus
        />
      </div>

      {vm.categoryOptions.length > 0 && (
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
            Categoria
          </label>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {vm.categoryOptions.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => presenter.setCategoryId(category.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  category.value === vm.form.categoryId
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                    : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {vm.accountOptions.length > 1 && (
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
            Cuenta
          </label>
          <select
            value={vm.form.accountId}
            onChange={(event) => presenter.setAccountId(event.target.value)}
            className="glass-input w-full px-4 py-2.5 text-sm"
          >
            {vm.accountOptions.map((account) => (
              <option key={account.value} value={account.value}>
                {account.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          Nota (opcional)
        </label>
        <input
          type="text"
          placeholder="Ej: Almuerzo con amigos"
          value={vm.form.description}
          onChange={(event) => presenter.setDescription(event.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        />
      </div>

      {vm.errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-[var(--accent-red-glow)] p-3">
          <p className="text-sm text-[var(--accent-red)]">{vm.errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={vm.isSubmitting || !vm.isReady}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {vm.submitLabel}
      </button>
    </form>
  );
}
