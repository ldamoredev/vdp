"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Transaction } from "@/lib/api/types";
import { useWalletActions, useWalletData } from "../use-wallet-context";
import {
  buildEditFormFromTransaction,
  buildUpdatePayload,
  validateEditTransaction,
} from "./edit-transaction-form-state";

interface EditTransactionSheetProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
}

export function EditTransactionSheet({
  transaction,
  open,
  onClose,
}: EditTransactionSheetProps) {
  const { accounts, categories, isUpdatingTransaction } = useWalletData();
  const { updateTransaction } = useWalletActions();
  const [form, setForm] = useState(() => buildEditFormFromTransaction(transaction));
  const [message, setMessage] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const matchingCategories = categories.filter(
    (category) => category.type === transaction.type,
  );

  useEffect(() => {
    if (!open) return;
    setForm(buildEditFormFromTransaction(transaction));
    setMessage(null);
    amountInputRef.current?.focus();
  }, [open, transaction]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    if (!open) return;

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    const validationError = validateEditTransaction(form);
    if (validationError) {
      setMessage(validationError.message);
      return;
    }

    const payload = buildUpdatePayload(transaction, form);
    if (!payload) {
      setMessage("Sin cambios");
      window.setTimeout(onClose, 250);
      return;
    }

    try {
      setMessage(null);
      await updateTransaction({ id: transaction.id, data: payload });
      onClose();
    } catch {
      setMessage("No se pudo guardar la transaccion");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Editar transaccion"
    >
      <div
        className="glass-card-static w-full max-w-lg rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Editar transaccion
          </h2>
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
              Monto ({transaction.currency})
            </label>
            <input
              ref={amountInputRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
              className="glass-input w-full px-4 py-3 text-2xl font-semibold"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Cuenta
            </label>
            <select
              value={form.accountId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  accountId: event.target.value,
                }))
              }
              className="glass-input w-full px-4 py-2.5 text-sm"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
          </div>

          {matchingCategories.length > 0 ? (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Categoría
              </label>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, categoryId: "" }))
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    form.categoryId === ""
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                      : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Sin categoría
                </button>
                {matchingCategories.map((category) => {
                  const isSelected = category.id === form.categoryId;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          categoryId: category.id,
                        }))
                      }
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
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Fecha
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Descripción
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="glass-input w-full px-4 py-2.5 text-sm"
                placeholder="Ej: Almuerzo"
              />
            </div>
          </div>

          {message ? (
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
              <p className="text-sm text-[var(--foreground)]">{message}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isUpdatingTransaction}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {isUpdatingTransaction ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
