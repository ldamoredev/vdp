"use client";

import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/lib/api/wallet";
import { SkeletonCard } from "./components/skeleton";
import { AccountCard } from "./components/account-card";
import { StatsSummary } from "./components/stats-summary";
import { RecentTransactions } from "./components/recent-transactions";

export default function DashboardPage() {
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: walletApi.getAccounts,
  });
  const { data: txResult, isLoading: loadingTx } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => walletApi.getTransactions({ limit: "10" }),
  });
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["stats", "summary"],
    queryFn: () => walletApi.getStatsSummary(),
  });

  const recentTx = txResult?.data || [];

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Resumen de tus finanzas personales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {loadingAccounts ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          accounts.map((acc: any) => (
            <AccountCard key={acc.id} account={acc} />
          ))
        )}
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : stats ? (
        <StatsSummary stats={stats} />
      ) : null}

      <RecentTransactions transactions={recentTx} isLoading={loadingTx} />
    </div>
  );
}
