"use client";

import { CategoriesScreen } from "@/features/wallet/presentation/components/categories-screen";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";

export default function WalletCategoriesPage() {
  return (
    <WalletProvider scope="categories">
      <CategoriesScreen />
    </WalletProvider>
  );
}
