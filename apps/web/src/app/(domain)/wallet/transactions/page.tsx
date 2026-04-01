"use client";

import { TransactionsScreen } from "@/features/wallet/presentation/components/transactions-screen";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";

export default function TransactionsPage() {
  return (
    <WalletProvider scope="transactions">
      <TransactionsScreen />
    </WalletProvider>
  );
}
