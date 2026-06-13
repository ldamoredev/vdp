import { useSearchParams } from "react-router";
import { TransactionsScreen } from "@/features/wallet/components/transactions-screen";
import { WalletProvider } from "@/features/wallet/wallet-context";
import { buildInitialTransactionFilters } from "@/features/wallet/wallet-selectors";

export default function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const initialTransactionFilters = buildInitialTransactionFilters({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
  });

  return (
    <WalletProvider
      scope="transactions"
      initialTransactionFilters={initialTransactionFilters}
    >
      <TransactionsScreen />
    </WalletProvider>
  );
}
