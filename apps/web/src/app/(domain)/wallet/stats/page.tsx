"use client";

import { StatsScreen } from "@/features/wallet/presentation/components/stats-screen";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";

export default function StatsPage() {
  return (
    <WalletProvider scope="stats">
      <StatsScreen />
    </WalletProvider>
  );
}
