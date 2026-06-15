import { useSearchParams } from "react-router";
import { buildInitialTransactionFilters } from "@/core/domain/wallet/Transaction";
import { TransactionsScreen } from "@/ui/screens/wallet/transactions/TransactionsScreen";

export default function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const initialTransactionFilters = buildInitialTransactionFilters({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
  });

  return <TransactionsScreen initialFilters={initialTransactionFilters} />;
}
