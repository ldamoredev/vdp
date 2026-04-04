"use client";

import Link from "next/link";
import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Trash2,
} from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { useWalletActions, useWalletData } from "../use-wallet-context";
import type { TransactionType } from "@/lib/api/types";
import { getTransactionPresentation } from "../wallet-selectors";

function getTypeIcon(type: TransactionType) {
  switch (type) {
    case "income":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-green-glow)]">
          <ArrowDownLeft size={14} className="text-[var(--accent-green)]" />
        </div>
      );
    case "expense":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-red-glow)]">
          <ArrowUpRight size={14} className="text-[var(--accent-red)]" />
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
          <ArrowLeftRight size={14} className="text-[var(--accent)]" />
        </div>
      );
  }
}

export function TransactionsScreen() {
  const {
    transactions,
    totalTransactions,
    transactionFilters,
    currentTransactionsPage,
    totalTransactionsPages,
    canGoPreviousTransactionsPage,
    canGoNextTransactionsPage,
    isLoadingTransactions,
  } = useWalletData();
  const {
    setTransactionType,
    setTransactionFrom,
    setTransactionTo,
    previousTransactionsPage,
    nextTransactionsPage,
    deleteTransaction,
  } = useWalletActions();

  return (
    <ModulePage width="5xl" spacing="6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Transacciones
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {totalTransactions} transacciones en total
          </p>
        </div>
        <Link href="/wallet/transactions/new" className="btn-primary">
          <Plus size={16} />
          Nueva
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Filter size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">
            Filtros
          </span>
        </div>

        <select
          className="glass-input px-3 py-2 text-sm"
          value={transactionFilters.type || ""}
          onChange={(event) =>
            setTransactionType(
              (event.target.value as "income" | "expense" | "transfer" | "") ||
                "",
            )
          }
        >
          <option value="">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
          <option value="transfer">Transferencias</option>
        </select>

        <input
          type="date"
          className="glass-input px-3 py-2 text-sm"
          value={transactionFilters.from || ""}
          onChange={(event) => setTransactionFrom(event.target.value)}
        />
        <input
          type="date"
          className="glass-input px-3 py-2 text-sm"
          value={transactionFilters.to || ""}
          onChange={(event) => setTransactionTo(event.target.value)}
        />
      </div>

      <div className="glass-card-static overflow-hidden">
        {isLoadingTransactions ? (
          <StateCard
            size="lg"
            className="border-none"
            description="Cargando..."
            icon={
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            }
          />
        ) : transactions.length === 0 ? (
          <StateCard
            size="lg"
            className="border-none"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hover-overlay)]">
                <ArrowLeftRight size={20} className="text-[var(--muted)]" />
              </div>
            }
            title="No hay transacciones"
          />
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripcion</th>
                <th>Tipo</th>
                <th className="text-right">Monto</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const presentation = getTransactionPresentation(transaction.type);
                return (
                  <tr key={transaction.id}>
                    <td className="text-[var(--foreground-muted)]">
                      {formatDate(transaction.date)}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {getTypeIcon(transaction.type)}
                        <span className="font-medium">
                          {transaction.description || "-"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          presentation.tone === "income"
                            ? "badge-green"
                            : presentation.tone === "expense"
                              ? "badge-red"
                              : "badge-blue"
                        }`}
                      >
                        {presentation.label}
                      </span>
                    </td>
                    <td
                      className={`text-right font-semibold tabular-nums ${
                        presentation.tone === "income"
                          ? "text-[var(--accent-green)]"
                          : presentation.tone === "expense"
                            ? "text-[var(--accent-red)]"
                            : "text-[var(--accent)]"
                      }`}
                    >
                      {presentation.sign}
                      {formatMoney(
                        transaction.amount,
                        transaction.currency as "ARS" | "USD",
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="rounded-lg p-2 text-[var(--muted)] transition-all hover:bg-[var(--accent-red-glow)] hover:text-[var(--accent-red)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalTransactionsPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--muted)]">
            Pagina {currentTransactionsPage} de {totalTransactionsPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={!canGoPreviousTransactionsPage}
              onClick={previousTransactionsPage}
              className="btn-secondary px-3 py-2 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button
              disabled={!canGoNextTransactionsPage}
              onClick={nextTransactionsPage}
              className="btn-secondary px-3 py-2 disabled:opacity-30"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
