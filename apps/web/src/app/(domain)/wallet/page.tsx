"use client";

import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/lib/api/wallet";
import { formatMoney, formatDate } from "@/lib/format";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function SkeletonCard() {
  return (
    <div className="glass-card-static p-5 space-y-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-8 w-36" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-xl" />
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton h-4 w-24" />
    </div>
  );
}

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
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Resumen de tus finanzas personales
        </p>
      </div>

      {/* Account Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {loadingAccounts ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          accounts.map((acc: any) => (
            <div
              key={acc.id}
              className="glass-card p-5 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-[var(--foreground-muted)] text-sm">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
                    <Wallet size={15} className="text-[var(--accent)]" />
                  </div>
                  <span className="font-medium">{acc.name}</span>
                </div>
                <span className="badge badge-muted">{acc.currency}</span>
              </div>
              <div className="text-2xl font-semibold tracking-tight">
                {formatMoney(acc.currentBalance || acc.initialBalance, acc.currency)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Monthly Summary */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          <div className="glass-card-static p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--foreground-muted)]">
                Ingresos del mes
              </span>
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-green-glow)] flex items-center justify-center">
                <TrendingUp size={15} className="text-[var(--accent-green)]" />
              </div>
            </div>
            <div className="text-xl font-semibold text-[var(--accent-green)]">
              +{formatMoney(stats.totalIncome || 0, "ARS")}
            </div>
          </div>
          <div className="glass-card-static p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--foreground-muted)]">
                Gastos del mes
              </span>
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-red-glow)] flex items-center justify-center">
                <TrendingDown size={15} className="text-[var(--accent-red)]" />
              </div>
            </div>
            <div className="text-xl font-semibold text-[var(--accent-red)]">
              -{formatMoney(stats.totalExpense || 0, "ARS")}
            </div>
          </div>
          <div className="glass-card-static p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--foreground-muted)]">
                Neto
              </span>
              <div className="w-8 h-8 rounded-lg bg-[var(--hover-overlay)] flex items-center justify-center">
                <Minus size={15} className="text-[var(--foreground-muted)]" />
              </div>
            </div>
            <div className="text-xl font-semibold">
              {formatMoney(stats.net || 0, "ARS")}
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Transactions */}
      <div className="glass-card-static overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border)]">
          <h3 className="font-medium">Transacciones recientes</h3>
          <Link
            href="/wallet/transactions"
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--blue-soft-text)] transition-colors cursor-pointer"
          >
            Ver todas
            <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {loadingTx ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : recentTx.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--hover-overlay)] flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight size={20} className="text-[var(--muted)]" />
              </div>
              <p className="text-[var(--muted)] text-sm">
                No hay transacciones aun
              </p>
              <p className="text-[var(--muted)] text-xs mt-1">
                Usa el chat o crea una manualmente
              </p>
            </div>
          ) : (
            recentTx.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-[var(--hover-overlay)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.type === "income"
                        ? "bg-[var(--accent-green-glow)]"
                        : "bg-[var(--accent-red-glow)]"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowDownLeft
                        size={16}
                        className="text-[var(--accent-green)]"
                      />
                    ) : (
                      <ArrowUpRight
                        size={16}
                        className="text-[var(--accent-red)]"
                      />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {tx.description || tx.type}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {formatDate(tx.date)}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold tabular-nums ${
                    tx.type === "income"
                      ? "text-[var(--accent-green)]"
                      : "text-[var(--accent-red)]"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatMoney(tx.amount, tx.currency)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
