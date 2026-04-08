"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AccountCard } from "./account-card";
import { RecentTransactions } from "./recent-transactions";
import { SkeletonCard } from "./skeleton";
import { StatsSummary } from "./stats-summary";
import { useWalletData } from "../use-wallet-context";
import { ModulePage } from "@/components/primitives/module-page";
import { QuickAddExpenseSheet } from "../quick-add/quick-add-expense-sheet";

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

  return (
    <ModulePage width="5xl" spacing="8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Resumen de tus finanzas personales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>

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
        <StatsSummary stats={statsSummary} />
      )}

      <RecentTransactions
        transactions={recentTransactions}
        isLoading={isLoadingRecentTransactions}
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
    </ModulePage>
  );
}
