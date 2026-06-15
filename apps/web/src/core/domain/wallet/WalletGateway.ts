import type { Currency } from "@vdp/shared";

import type { Account, AccountType } from "./Account";
import type { Category, CategoryType } from "./Category";
import type { ExchangeRate, ExchangeRateType } from "./ExchangeRate";
import type { Investment, InvestmentType } from "./Investment";
import type { SavingsGoal } from "./SavingsGoal";
import type { Transaction, WalletTransactionFilters } from "./Transaction";
import type { CategoryStat, MonthlyTrend, WalletStatsSummary } from "./WalletStats";

export interface CreateAccountInput {
  name: string;
  currency: Currency;
  type: AccountType;
  initialBalance: string;
}
export type UpdateAccountInput = Partial<CreateAccountInput>;

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  icon: string;
}

export interface CreateTransactionInput {
  accountId: string;
  categoryId?: string | null;
  type: Transaction["type"];
  amount: string;
  currency: Currency;
  description?: string | null;
  date?: string;
  transferToAccountId?: string | null;
  tags?: string[];
}
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface CreateSavingsGoalInput {
  name: string;
  targetAmount: string;
  currency: Currency;
  deadline: string | null;
}
export type UpdateSavingsGoalInput = Partial<
  Pick<CreateSavingsGoalInput, "name" | "targetAmount" | "deadline">
>;
export interface ContributeSavingsInput {
  amount: string;
  note?: string;
  date?: string;
}

export interface CreateInvestmentInput {
  name: string;
  type: InvestmentType;
  accountId?: string | null;
  currency: Currency;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate?: string | null;
  rate?: string | null;
  notes?: string | null;
}
export type UpdateInvestmentInput = Partial<CreateInvestmentInput>;

export interface CreateExchangeRateInput {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  type: ExchangeRateType;
}

export interface TransactionList {
  transactions: Transaction[];
  total: number;
}

/**
 * Port for the wallet backend. Reads return domain models; writes that the UI
 * acts on return the affected entity, deletes return void and the presenter
 * re-queries. Implemented by HttpWalletGateway; faked in tests.
 */
export interface WalletGateway {
  // accounts
  getAccounts(): Promise<Account[]>;
  createAccount(input: CreateAccountInput): Promise<Account>;
  updateAccount(id: string, input: UpdateAccountInput): Promise<Account>;
  deleteAccount(id: string): Promise<void>;

  // categories
  getCategories(type?: CategoryType): Promise<Category[]>;
  createCategory(input: CreateCategoryInput): Promise<Category>;

  // transactions
  getTransactions(params?: Partial<WalletTransactionFilters>): Promise<TransactionList>;
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // savings
  getSavings(): Promise<SavingsGoal[]>;
  createSavingsGoal(input: CreateSavingsGoalInput): Promise<SavingsGoal>;
  updateSavingsGoal(id: string, input: UpdateSavingsGoalInput): Promise<SavingsGoal>;
  contributeSavings(id: string, input: ContributeSavingsInput): Promise<SavingsGoal>;

  // investments
  getInvestments(): Promise<Investment[]>;
  createInvestment(input: CreateInvestmentInput): Promise<Investment>;
  updateInvestment(id: string, input: UpdateInvestmentInput): Promise<Investment>;

  // stats
  getStatsSummary(params?: Record<string, string>): Promise<WalletStatsSummary>;
  getStatsByCategory(params?: Record<string, string>): Promise<CategoryStat[]>;
  getMonthlyTrend(): Promise<MonthlyTrend[]>;

  // exchange rates
  getExchangeRates(): Promise<ExchangeRate[]>;
  createExchangeRate(input: CreateExchangeRateInput): Promise<ExchangeRate>;
}
