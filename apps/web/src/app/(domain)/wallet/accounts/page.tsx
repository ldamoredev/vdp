"use client";

import { AccountsScreen } from "@/features/wallet/components/accounts-screen";
import { WalletProvider } from "@/features/wallet/wallet-context";

export default function WalletAccountsPage() {
  return (
    <WalletProvider scope="accounts">
      <AccountsScreen />
    </WalletProvider>
  );
}
