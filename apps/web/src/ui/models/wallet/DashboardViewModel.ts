import type { Currency } from "@vdp/shared";
import type { EditTransactionFormField, EditTransactionSheetVM } from "./TransactionsViewModel";

export type { EditTransactionFormField, EditTransactionSheetVM };

export interface DashboardViewModel {
  title: string;
  intro: string;
  eyebrow: string;
  quickAddLabel: string;
  newTransactionLabel: string;
  newTransactionHref: string;
  statsLabel: string;
  statsHref: string;
  stats: DashboardStatVM[];
  accounts: DashboardAccountVM[];
  recentTransactions: DashboardTransactionRowVM[];
  recentTitle: string;
  recentHref: string;
  recentActionLabel: string;
  sanity: DashboardSanityVM;
  editSheet: EditTransactionSheetVM | null;
  isLoadingAccounts: boolean;
  isLoadingStats: boolean;
  isLoadingRecentTransactions: boolean;
  error: boolean;
}

export interface DashboardStatVM {
  label: string;
  valueLabel: string;
  tone: "income" | "expense" | "neutral";
}

export interface DashboardAccountVM {
  id: string;
  name: string;
  currency: Currency;
  balanceLabel: string;
}

export interface DashboardTransactionRowVM {
  id: string;
  descriptionLabel: string;
  metaLabel: string;
  amountLabel: string;
  tone: "income" | "expense" | "transfer";
  isEditable: boolean;
}

export interface DashboardSanityVM {
  transactionCount: number;
  totalAmountLabel: string;
  label: string;
}
