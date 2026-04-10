import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CollectionCard } from "@/components/primitives/collection-card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/api/types";
import { SkeletonRow } from "./skeleton";

export function RecentTransactions({
  transactions,
  isLoading,
  onTransactionClick,
}: {
  transactions: Transaction[];
  isLoading: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
}) {
  return (
    <CollectionCard
      title="Transacciones recientes"
      icon={null}
      action={
        <Link
          href="/wallet/transactions"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--blue-soft-text)]"
        >
          Ver todas
          <ArrowRight size={12} />
        </Link>
      }
    >
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
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hover-overlay)]">
              <ArrowUpRight size={20} className="text-[var(--muted)]" />
            </div>
            <p className="text-sm text-[var(--muted)]">
              No hay transacciones aun
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Empeza registrando tu primer movimiento.
            </p>
            <Link
              href="/wallet/transactions/new"
              className="btn-primary mt-4 inline-flex"
            >
              Crear primera transaccion
            </Link>
          </div>
        ) : (
          transactions.map((transaction) => (
            onTransactionClick && transaction.type !== "transfer" ? (
              <button
                key={transaction.id}
                type="button"
                onClick={() => onTransactionClick(transaction)}
                aria-label={`Editar transaccion ${transaction.description || transaction.type}`}
                className="flex w-full items-center justify-between p-4 text-left transition-all hover:bg-[var(--hover-overlay)] hover:translate-x-0.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      transaction.type === "income"
                        ? "bg-[var(--accent-green-glow)]"
                        : "bg-[var(--accent-red-glow)]"
                    }`}
                  >
                    {transaction.type === "income" ? (
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
                      {transaction.description || transaction.type}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {formatDate(transaction.date)}
                    </div>
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
              </button>
            ) : (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 transition-all hover:bg-[var(--hover-overlay)] hover:translate-x-0.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      transaction.type === "income"
                        ? "bg-[var(--accent-green-glow)]"
                        : "bg-[var(--accent-red-glow)]"
                    }`}
                  >
                    {transaction.type === "income" ? (
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
                      {transaction.description || transaction.type}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {formatDate(transaction.date)}
                    </div>
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
            )
          ))
        )}
    </CollectionCard>
  );
}
