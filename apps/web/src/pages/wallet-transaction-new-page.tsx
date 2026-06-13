import { TransactionFormScreen } from "@/features/wallet/components/transaction-form-screen";
import { WalletTransactionFormProvider } from "@/features/wallet/wallet-transaction-form-context";

export default function NewTransactionPage() {
  return (
    <WalletTransactionFormProvider>
      <TransactionFormScreen />
    </WalletTransactionFormProvider>
  );
}
