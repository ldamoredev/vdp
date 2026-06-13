import { SavingsScreen } from "@/features/wallet/components/savings-screen";
import { WalletProvider } from "@/features/wallet/wallet-context";

export default function SavingsPage() {
  return (
    <WalletProvider scope="savings">
      <SavingsScreen />
    </WalletProvider>
  );
}
