import { TransactionsScreen } from "@/features/wallet/presentation/components/transactions-screen";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";
import { buildInitialTransactionFilters } from "@/features/wallet/presentation/wallet-selectors";

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialTransactionFilters = buildInitialTransactionFilters({
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
    type: resolvedSearchParams?.type,
    categoryId: resolvedSearchParams?.categoryId,
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
