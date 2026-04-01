"use client";

import { AccountsScreen } from "@/features/wallet/presentation/components/accounts-screen";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";

export default function WalletAccountsPage() {
  return (
    <WalletProvider scope="accounts">
      <AccountsScreen />
    </WalletProvider>
  );
}
