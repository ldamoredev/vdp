"use client";

import { InvestmentsScreen } from "@/features/wallet/components/investments-screen";
import { WalletProvider } from "@/features/wallet/wallet-context";

export default function InvestmentsPage() {
  return (
    <WalletProvider scope="investments">
      <InvestmentsScreen />
    </WalletProvider>
  );
}
