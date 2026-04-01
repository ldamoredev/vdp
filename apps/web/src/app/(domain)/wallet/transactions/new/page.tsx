"use client";

import { TransactionFormScreen } from "@/features/wallet/presentation/components/transaction-form-screen";
import { WalletTransactionFormProvider } from "@/features/wallet/presentation/wallet-transaction-form-context";

export default function NewTransactionPage() {
  return (
    <WalletTransactionFormProvider>
      <TransactionFormScreen />
    </WalletTransactionFormProvider>
  );
}
