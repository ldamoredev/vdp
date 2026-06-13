import { CategoriesScreen } from "@/features/wallet/components/categories-screen";
import { WalletProvider } from "@/features/wallet/wallet-context";

export default function WalletCategoriesPage() {
  return (
    <WalletProvider scope="categories">
      <CategoriesScreen />
    </WalletProvider>
  );
}
