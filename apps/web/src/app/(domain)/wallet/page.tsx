"use client";

import { WalletProvider } from "@/features/wallet/presentation/wallet-context";
import { DashboardScreen } from "@/features/wallet/presentation/components/dashboard-screen";

export default function DashboardPage() {
  return (
    <WalletProvider scope="dashboard">
      <DashboardScreen />
    </WalletProvider>
  );
}
