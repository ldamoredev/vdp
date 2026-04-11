"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { useWalletActions, useWalletData } from "../use-wallet-context";
import type { Transaction, TransactionType } from "@/lib/api/types";
import {
  buildVisibleTransactionTotal,
  getTransactionPresentation,
} from "../wallet-selectors";
import { EditTransactionSheet } from "../edit-transaction/edit-transaction-sheet";
import { SanityStrip } from "../sanity-strip/sanity-strip";
import { WalletEmptyState } from "./wallet-empty-state";
import {
  buildWalletEmptyState,
  buildWalletScreenIntro,
} from "../wallet-polish-selectors";

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
    categories,
    currentTransactionsPage,
    totalTransactionsPages,
    canGoPreviousTransactionsPage,
    canGoNextTransactionsPage,
    isLoadingTransactions,
  } = useWalletData();
  const {
    setTransactionType,
    setTransactionCategoryId,
    setTransactionFrom,
    setTransactionTo,
    previousTransactionsPage,
    nextTransactionsPage,
    deleteTransaction,
  } = useWalletActions();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null,
  );

  const activeCategory = categories.find(
    (category) => category.id === transactionFilters.categoryId,
  );
  const visibleSummary = buildVisibleTransactionTotal(transactions);
  const visibleTotalAmount =
    !visibleSummary.mixedCurrencies && visibleSummary.currency
      ? formatMoney(visibleSummary.amount, visibleSummary.currency)
      : "Varias monedas";

  let dateRange: { from: string; to: string } | undefined;
  if (transactionFilters.from && transactionFilters.to) {
    dateRange = {
      from: transactionFilters.from,
      to: transactionFilters.to,
    };
  } else if (transactions.length > 0) {
    const dates = transactions.map((transaction) => transaction.date).sort();
    dateRange = {
      from: dates[0],
      to: dates[dates.length - 1],
    };
  }

  return (
    <ModulePage width="5xl" spacing="6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Transacciones
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {buildWalletScreenIntro("transactions")}
          </p>
        </div>
        <Link
          href="/wallet/transactions/new"
          className="btn-primary w-full sm:w-auto justify-center"
        >
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

        {transactionFilters.categoryId ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-sm">
            <span>Filtro: {activeCategory?.name || "Categoría"}</span>
            <button
              type="button"
              onClick={() => setTransactionCategoryId("")}
              className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              aria-label="Quitar filtro de categoria"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}
      </div>

      <SanityStrip
        transactionCount={transactions.length}
        totalAmount={visibleTotalAmount}
        dateRange={dateRange}
      />

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
          <WalletEmptyState {...buildWalletEmptyState("transactions")} />
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
                const isEditable = transaction.type !== "transfer";
                return (
                  <tr
                    key={transaction.id}
                    onClick={
                      isEditable
                        ? () => setEditingTransaction(transaction)
                        : undefined
                    }
                    className={
                      isEditable
                        ? "cursor-pointer transition-colors hover:bg-[var(--hover-overlay)]"
                        : undefined
                    }
                  >
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
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteTransaction(transaction.id);
                        }}
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

      {editingTransaction ? (
        <EditTransactionSheet
          transaction={editingTransaction}
          open
          onClose={() => setEditingTransaction(null)}
        />
      ) : null}
    </ModulePage>
  );
}
