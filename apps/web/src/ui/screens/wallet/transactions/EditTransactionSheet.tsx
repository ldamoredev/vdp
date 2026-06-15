import { X } from "lucide-react";

import type {
  EditTransactionFormField,
  EditTransactionSheetVM,
} from "@/ui/models/wallet/TransactionsViewModel";

interface EditTransactionSheetController {
  closeEdit(): void;
  setEditField(field: EditTransactionFormField, value: string): void;
  submitEdit(): Promise<void>;
}

interface EditTransactionSheetProps {
  vm: EditTransactionSheetVM;
  presenter: EditTransactionSheetController;
}

export function EditTransactionSheet({ vm, presenter }: EditTransactionSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={() => presenter.closeEdit()}
      role="dialog"
      aria-modal="true"
      aria-label={vm.title}
    >
      <div
        className="glass-card-static w-full max-w-lg rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{vm.title}</h2>
          <button
            type="button"
            onClick={() => presenter.closeEdit()}
            className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void presenter.submitEdit();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Monto ({vm.currency})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={vm.amount}
              onChange={(event) => presenter.setEditField("amount", event.target.value)}
              className="glass-input w-full px-4 py-3 text-2xl font-data font-semibold"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Cuenta
            </label>
            <select
              value={vm.accountId}
              onChange={(event) => presenter.setEditField("accountId", event.target.value)}
              className="glass-input w-full px-4 py-2.5 text-sm"
            >
              {vm.accountOptions.map((account) => (
                <option key={account.value} value={account.value}>
                  {account.label}
                </option>
              ))}
            </select>
          </div>

          {vm.categoryOptions.length > 0 ? (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Categoria
              </label>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <button
                  type="button"
                  onClick={() => presenter.setEditField("categoryId", "")}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    vm.categoryId === ""
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                      : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Sin categoria
                </button>
                {vm.categoryOptions.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => presenter.setEditField("categoryId", category.value)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      category.value === vm.categoryId
                        ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                        : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Fecha
              </label>
              <input
                type="date"
                value={vm.date}
                onChange={(event) => presenter.setEditField("date", event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Descripcion
              </label>
              <input
                type="text"
                value={vm.description}
                onChange={(event) => presenter.setEditField("description", event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
                placeholder="Ej: Almuerzo"
              />
            </div>
          </div>

          {vm.message ? (
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
              <p className="text-sm text-[var(--foreground)]">{vm.message}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!vm.canSubmit}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {vm.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
