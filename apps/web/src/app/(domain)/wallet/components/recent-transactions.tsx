import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/format";
import { SkeletonRow } from "./skeleton";
import type { Transaction } from "@/lib/api/types";

interface RecentTransactionsProps {
  readonly transactions: readonly Transaction[];
  readonly isLoading: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  return (
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
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : transactions.length === 0 ? (
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
          transactions.map((tx) => (
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
                {formatMoney(tx.amount, tx.currency as "ARS" | "USD")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
