import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/api/types";
import { buildWalletTransactionMeta } from "../wallet-polish-selectors";

interface WalletTransactionRowProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  action?: React.ReactNode;
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

export function WalletTransactionRow({
  transaction,
  onClick,
  action,
}: WalletTransactionRowProps) {
  const amountTone =
    transaction.type === "income"
      ? "text-[var(--accent-green)]"
      : transaction.type === "expense"
        ? "text-[var(--accent-red)]"
        : "text-[var(--accent)]";
  const sign =
    transaction.type === "income"
      ? "+"
      : transaction.type === "expense"
        ? "-"
        : "";

  const content = (
    <>
      <div className="flex items-center gap-3">
        <TransactionIcon type={transaction.type} />

        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[var(--foreground)]">
            {transaction.description || transaction.type}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {buildWalletTransactionMeta({
              categoryName: transaction.categoryName,
              date: transaction.date,
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`text-right text-sm font-semibold tabular-nums ${amountTone}`}>
          {sign}
          {formatMoney(transaction.amount, transaction.currency)}
        </div>
        {action}
      </div>
    </>
  );

  if (onClick) {
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
