import { AlertTriangle, PencilLine } from "lucide-react";
import type { Transaction } from "@/lib/api/types";
import type { WalletReviewSignal } from "../daily-review-types";
import { WalletTransactionRow } from "@/features/wallet/presentation/components/wallet-transaction-row";

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
              <WalletTransactionRow
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
