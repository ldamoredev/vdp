"use client";

import { InvestmentsScreen } from "@/features/wallet/presentation/components/investments-screen";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";

export default function InvestmentsPage() {
  return (
    <WalletProvider scope="investments">
      <InvestmentsScreen />
    </WalletProvider>
  );
}
