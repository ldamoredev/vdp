import { WalletProvider } from "@/features/wallet/wallet-context";
import { DashboardScreen } from "@/features/wallet/components/dashboard-screen";

export default function DashboardPage() {
  return (
    <WalletProvider scope="dashboard">
      <DashboardScreen />
    </WalletProvider>
  );
}
