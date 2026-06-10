"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useQuickAddExpense } from "./use-quick-add-expense";

interface QuickAddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
}

export function QuickAddExpenseSheet({ open, onClose }: QuickAddExpenseSheetProps) {
  const {
    accounts,
    expenseCategories,
    form,
    isReady,
    isSubmitting,
    errorMessage,
    setAmount,
    setAccountId,
    setCategoryId,
    setDescription,
    submit,
    reset,
  } = useQuickAddExpense();

  const amountInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      amountInputRef.current?.focus();
    } else {
      reset();
    }
    // Intentionally exclude `reset` to avoid re-running on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
    return undefined;
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const ok = await submit();
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Cargar gasto rápido"
    >
      <div
        className="glass-card-static w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Gasto rápido</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Monto ({form.currency})
            </label>
            <input
              ref={amountInputRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(event) => setAmount(event.target.value)}
              className="glass-input w-full px-4 py-3 text-2xl font-semibold"
              required
              autoFocus
            />
          </div>

          {expenseCategories.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Categoría
              </label>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {expenseCategories.map((category) => {
                  const isSelected = category.id === form.categoryId;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                          : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {accounts.length > 1 && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Cuenta
              </label>
              <select
                value={form.accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
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
              value={form.description}
              onChange={(event) => setDescription(event.target.value)}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-[var(--accent-red-glow)] p-3">
              <p className="text-sm text-[var(--accent-red)]">{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isReady}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {isSubmitting ? "Guardando..." : "Guardar gasto"}
          </button>
        </form>
      </div>
    </div>
  );
}
