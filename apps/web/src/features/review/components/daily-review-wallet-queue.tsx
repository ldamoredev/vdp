import { AlertTriangle, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, PencilLine } from "lucide-react";
import type { ReactNode } from "react";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import { formatDateShort, formatMoney } from "@/lib/format";
import type { WalletReviewSignal } from "../daily-review-types";

interface DailyReviewWalletQueueProps {
  signals: WalletReviewSignal[];
  transactions: Transaction[];
  summary?: string;
  onAcknowledgeSignal?: (signalId: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export function DailyReviewWalletQueue({
  signals,
  transactions,
  summary,
  onAcknowledgeSignal,
  onEditTransaction,
}: DailyReviewWalletQueueProps) {
  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Verificar wallet
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Revisa gastos dudosos, categorías raras y montos que conviene confirmar.
        </p>
        {summary ? (
          <p className="mt-2 text-xs text-[var(--muted)]">{summary}</p>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        {signals.length === 0 ? (
          <div className="rounded-2xl border border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] p-4 text-sm text-[var(--foreground)]">
            Wallet queda en cero dudas visibles para hoy.
          </div>
        ) : (
          signals.map((signal) => (
            <div
              key={signal.id}
              className="rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[var(--amber-soft-text)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {signal.title}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                    {signal.body}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAcknowledgeSignal?.(signal.id)}
                  disabled={!onAcknowledgeSignal}
                  className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-xs font-medium text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reconocer
                </button>
              </div>
            </div>
          ))
        )}

        {transactions.length > 0 ? (
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--background-secondary)] p-2">
            {transactions.map((transaction) => (
              <WalletReviewTransactionRow
                key={transaction.id}
                transaction={transaction}
                onClick={onEditTransaction}
                action={
                  onEditTransaction ? (
                    <span className="rounded-lg bg-[var(--hover-overlay)] p-2 text-[var(--muted)]">
                      <PencilLine size={13} />
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function WalletReviewTransactionRow({
  transaction,
  onClick,
  action,
}: {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  action?: ReactNode;
}) {
  const tone =
    transaction.type === "income"
      ? "text-[var(--accent-green)]"
      : transaction.type === "expense"
        ? "text-[var(--accent-red)]"
        : "text-[var(--accent)]";
  const sign = transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : "";
  const content = (
    <>
      <div className="flex items-center gap-3">
        <TransactionIcon type={transaction.type} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[var(--foreground)]">
            {transaction.description || transaction.type}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {[transaction.categoryName, formatDateShort(transaction.date)].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`text-right text-sm font-data font-semibold tabular-nums ${tone}`}>
          {sign}
          {formatMoney(transaction.amount, transaction.currency)}
        </div>
        {action}
      </div>
    </>
  );

  if (onClick && !transaction.isTransfer) {
    return (
      <button
        type="button"
        onClick={() => onClick(transaction)}
        className="flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left transition-all hover:bg-[var(--hover-overlay)]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl p-4 transition-all hover:bg-[var(--hover-overlay)]">
      {content}
    </div>
  );
}

function TransactionIcon({ type }: { type: Transaction["type"] }) {
  if (type === "income") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-green-glow)]">
        <ArrowDownLeft size={16} className="text-[var(--accent-green)]" />
      </div>
    );
  }

  if (type === "expense") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-red-glow)]">
        <ArrowUpRight size={16} className="text-[var(--accent-red)]" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
      <ArrowLeftRight size={16} className="text-[var(--accent)]" />
    </div>
  );
}
