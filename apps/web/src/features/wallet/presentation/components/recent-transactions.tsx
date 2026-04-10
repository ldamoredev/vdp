import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CollectionCard } from "@/components/primitives/collection-card";
import type { Transaction } from "@/lib/api/types";
import { SkeletonRow } from "./skeleton";
import { WalletTransactionRow } from "./wallet-transaction-row";
import { WalletEmptyState } from "./wallet-empty-state";
import { buildWalletEmptyState } from "../wallet-polish-selectors";

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
          <WalletEmptyState {...buildWalletEmptyState("transactions")} />
        ) : (
          transactions.map((transaction) => (
            <WalletTransactionRow
              key={transaction.id}
              transaction={transaction}
              onClick={
                onTransactionClick && transaction.type !== "transfer"
                  ? onTransactionClick
                  : undefined
              }
            />
          ))
        )}
    </CollectionCard>
  );
}
