"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Transaction } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { AccountCard } from "./account-card";
import { RecentTransactions } from "./recent-transactions";
import { SkeletonCard } from "./skeleton";
import { useWalletData } from "../use-wallet-context";
import { ModulePage } from "@/components/primitives/module-page";
import { QuickAddExpenseSheet } from "../quick-add/quick-add-expense-sheet";
import { EditTransactionSheet } from "../edit-transaction/edit-transaction-sheet";
import { SanityStrip } from "../sanity-strip/sanity-strip";
import { WalletOperationalHeader } from "./wallet-operational-header";
import { buildWalletScreenIntro } from "../wallet-polish-selectors";

export function DashboardScreen() {
  const {
    accounts,
    recentTransactions,
    statsSummary,
    isLoadingAccounts,
    isLoadingRecentTransactions,
    isLoadingStatsSummary,
  } = useWalletData();
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null,
  );

  return (
    <ModulePage width="5xl" spacing="8">
      <WalletOperationalHeader
        title="Wallet"
        intro={buildWalletScreenIntro("dashboard")}
        action={
          <>
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="btn-primary"
            >
              <Plus size={16} />
              Gasto rápido
            </button>
            <Link href="/wallet/transactions/new" className="btn-secondary">
              Nueva transaccion
            </Link>
            <Link href="/wallet/stats" className="btn-secondary">
              Ver estadisticas
              <ArrowRight size={14} />
            </Link>
          </>
        }
        stats={
          <>
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                Ingresos
              </span>
              <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--accent-green)]">
                +{formatMoney(Number(statsSummary?.totalIncome ?? 0), "ARS")}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                Gastos
              </span>
              <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--accent-red)]">
                -{formatMoney(Number(statsSummary?.totalExpenses ?? 0), "ARS")}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                Neto
              </span>
              <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {formatMoney(Number(statsSummary?.netBalance ?? 0), "ARS")}
              </div>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
        {isLoadingAccounts ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))
        )}
      </div>

      {isLoadingStatsSummary ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <SanityStrip
            transactionCount={statsSummary?.transactionCount ?? 0}
            totalAmount={
              statsSummary
                ? formatMoney(Number(statsSummary.totalExpenses), "ARS")
                : formatMoney(0, "ARS")
            }
            label="en gastos"
          />
        </>
      )}

      <RecentTransactions
        transactions={recentTransactions}
        isLoading={isLoadingRecentTransactions}
        onTransactionClick={setEditingTransaction}
      />

      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Cargar gasto rápido"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 sm:hidden"
      >
        <Plus size={24} />
      </button>

      {isQuickAddOpen && (
        <QuickAddExpenseSheet
          open={isQuickAddOpen}
          onClose={() => setQuickAddOpen(false)}
        />
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
