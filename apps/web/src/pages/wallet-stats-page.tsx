import { StatsScreen } from "@/features/wallet/components/stats-screen";
import { WalletProvider } from "@/features/wallet/wallet-context";

export default function StatsPage() {
  return (
    <WalletProvider scope="stats">
      <StatsScreen />
    </WalletProvider>
  );
}
