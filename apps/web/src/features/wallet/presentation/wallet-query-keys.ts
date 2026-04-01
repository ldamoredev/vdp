import { createDomainQueryKeys } from "@/lib/query-keys";
import type { WalletTransactionFilters } from "./wallet-selectors";

const walletKeys = createDomainQueryKeys("wallet");

export const walletQueryKeys = {
  all: walletKeys.all,
  accounts: walletKeys.key("accounts"),
  recentTransactions: walletKeys.key("transactions", "recent"),
  transactions: (filters: WalletTransactionFilters) =>
    walletKeys.key("transactions", "list", filters),
  statsSummary: walletKeys.key("stats", "summary"),
  statsByCategory: walletKeys.key("stats", "by-category"),
  monthlyTrend: walletKeys.key("stats", "monthly-trend"),
  exchangeRates: walletKeys.key("exchange-rates", "latest"),
  savings: walletKeys.key("savings"),
  investments: walletKeys.key("investments"),
  categories: walletKeys.key("categories"),
} as const;
