import type {
  Currency,
  AccountType,
  TransactionType,
  CategoryType,
  InvestmentType,
  ExchangeRateType,
  PaginatedCollection,
} from "./common";

// ─── Wallet API response shapes ──────────────────────────
//
// These are the JSON wire shapes served by the wallet HTTP routes: dates are
// ISO strings, and some entities carry service-side enrichments
// (`currentBalance`, `categoryName`). The server's internal domain models live
// in `server/src/modules/wallet/domain/`.

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  type: AccountType;
  initialBalance: string;
  currentBalance?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  categoryName?: string;
  type: TransactionType;
  amount: string;
  currency: Currency;
  description: string | null;
  date: string;
  transferToAccountId?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export type WalletTransactionListResponse = PaginatedCollection<
  "transactions",
  Transaction
>;

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: Currency;
  deadline: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  accountId?: string | null;
  currency: Currency;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate: string | null;
  rate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletStatsSummary {
  currency: Currency;
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
  conversion: WalletStatsSummaryConversion;
}

export interface WalletStatsSummaryConversion {
  rateType: ExchangeRateType;
  rates: WalletStatsSummaryConversionRate[];
}

export interface WalletStatsSummaryConversionRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  date: string;
}

export interface CategoryStat {
  categoryId: string | null;
  categoryName: string;
  currency: Currency;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  currency: Currency;
  income: number;
  expense: number;
}

export interface FoodSpendingByCurrency {
  currency: Currency;
  total: number;
  count: number;
}

export interface FoodSpendingThisWeek {
  from: string;
  to: string;
  byCurrency: FoodSpendingByCurrency[];
}

export interface ExchangeRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  type: ExchangeRateType;
  date: string;
  createdAt?: string;
}
