"use client";

import { SavingsScreen } from "@/features/wallet/presentation/components/savings-screen";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";

export default function SavingsPage() {
  return (
    <WalletProvider scope="savings">
      <SavingsScreen />
    </WalletProvider>
  );
}
