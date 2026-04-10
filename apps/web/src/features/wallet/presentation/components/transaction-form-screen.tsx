"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ModulePage } from "@/components/primitives/module-page";
import { useWalletTransactionFormActions, useWalletTransactionFormData } from "../use-wallet-transaction-form-context";
import { buildWalletScreenIntro } from "../wallet-polish-selectors";

const typeOptions = [
  { value: "expense", label: "Gasto", color: "red" },
  { value: "income", label: "Ingreso", color: "green" },
  { value: "transfer", label: "Transferencia", color: "blue" },
] as const;

export function TransactionFormScreen() {
  const {
    accounts,
    filteredCategories,
    form,
    isSubmitting,
    errorMessage,
  } = useWalletTransactionFormData();
  const { setFormField, setType, submitTransaction, cancel } =
    useWalletTransactionFormActions();

  return (
    <ModulePage width="lg" spacing="6">
      <Link
        href="/wallet/transactions"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={16} />
        Volver a transacciones
      </Link>

      <div className="glass-card-static p-6">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">
          Nueva transaccion
        </h2>
        <p className="-mt-3 mb-6 text-sm text-[var(--muted)]">
          {buildWalletScreenIntro("transactions")}
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitTransaction();
          }}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Tipo
            </label>
            <div className="flex gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    form.type === option.value
                      ? option.color === "red"
                        ? "bg-[var(--accent-red)] text-white shadow-lg shadow-red-500/20"
                        : option.color === "green"
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
                value={form.amount}
                onChange={(event) =>
                  setFormField("amount", event.target.value)
                }
                className="glass-input flex-1 px-4 py-2.5 text-sm"
                required
              />
              <select
                value={form.currency}
                onChange={(event) =>
                  setFormField("currency", event.target.value)
                }
                className="glass-input px-4 py-2.5 text-sm"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Cuenta
            </label>
            <select
              value={form.accountId}
              onChange={(event) =>
                setFormField("accountId", event.target.value)
              }
              className="glass-input w-full px-4 py-2.5 text-sm"
            >
              <option value="">Seleccionar cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
          </div>

          {form.type !== "transfer" && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Categoria
              </label>
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setFormField("categoryId", event.target.value)
                }
                className="glass-input w-full px-4 py-2.5 text-sm"
              >
                <option value="">Sin categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
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
              value={form.description}
              onChange={(event) =>
                setFormField("description", event.target.value)
              }
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setFormField("date", event.target.value)}
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
              value={form.tags}
              onChange={(event) => setFormField("tags", event.target.value)}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
            <button type="button" onClick={cancel} className="btn-secondary">
              Cancelar
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-[var(--accent-red-glow)] p-3">
              <p className="text-sm text-[var(--accent-red)]">{errorMessage}</p>
            </div>
          )}
        </form>
      </div>
    </ModulePage>
  );
}
