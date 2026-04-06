import React from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { formatDateShort, formatMoney } from "@/lib/format";
import type { Transaction, WalletStatsSummary } from "@/lib/api/types";

export interface WalletSnapshotCardProps {
  readonly stats: WalletStatsSummary | undefined;
  readonly recentTransactions: readonly Transaction[];
}

export function WalletSnapshotCard({
  stats,
  recentTransactions,
}: WalletSnapshotCardProps) {
  const income = Number(stats?.totalIncome ?? 0);
  const expenses = Number(stats?.totalExpenses ?? 0);
  const netBalance = Number(stats?.netBalance ?? 0);
  const transactionCount = stats?.transactionCount ?? recentTransactions.length;
  const latestTransactions = recentTransactions.slice(0, 3);

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <Wallet size={16} style={{ color: "var(--blue-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Resumen Wallet
          </h3>
        </div>
        <Link
          href="/wallet/transactions/new"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--blue-soft-text)] transition-colors hover:text-[var(--accent)]"
        >
          Nueva transaccion
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Balance neto</span>
              <ArrowUpRight size={13} className="text-[var(--accent-green)]" />
            </div>
            <div className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              {formatMoney(netBalance, "ARS")}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Ingresos</span>
              <ArrowDownLeft size={13} className="text-[var(--accent-green)]" />
            </div>
            <div className="text-lg font-bold tracking-tight text-[var(--accent-green)]">
              +{formatMoney(income, "ARS")}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Gastos</span>
              <ArrowUpRight size={13} className="text-[var(--accent-red)]" />
            </div>
            <div className="text-lg font-bold tracking-tight text-[var(--accent-red)]">
              -{formatMoney(expenses, "ARS")}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--muted)]">Actividad reciente</div>
              <div className="text-sm font-medium text-[var(--foreground)]">
                {transactionCount} movimientos
              </div>
            </div>
            <span className="badge-muted badge">Hoy</span>
          </div>

          {latestTransactions.length > 0 ? (
            <div className="space-y-2">
              {latestTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--background-secondary)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--foreground)]">
                      {transaction.description || transaction.type}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {formatDateShort(transaction.date)}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      transaction.type === "income"
                        ? "text-[var(--accent-green)]"
                        : "text-[var(--accent-red)]"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatMoney(
                      transaction.amount,
                      transaction.currency as "ARS" | "USD",
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--muted)]">
              Todavia no hay movimientos recientes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
