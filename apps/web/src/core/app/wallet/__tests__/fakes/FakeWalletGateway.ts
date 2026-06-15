import type {
  Account as AccountDto,
  Category as CategoryDto,
  ExchangeRate as ExchangeRateDto,
  Investment as InvestmentDto,
  SavingsGoal as SavingsGoalDto,
  Transaction as TransactionDto,
} from "@vdp/shared";

import type { Account } from "../../../../domain/wallet/Account";
import type { Category, CategoryType } from "../../../../domain/wallet/Category";
import type { ExchangeRate } from "../../../../domain/wallet/ExchangeRate";
import { Investment } from "../../../../domain/wallet/Investment";
import { SavingsGoal } from "../../../../domain/wallet/SavingsGoal";
import { Transaction, type WalletTransactionFilters } from "../../../../domain/wallet/Transaction";
import type {
  CategoryStat,
  MonthlyTrend,
  WalletStatsSummary,
} from "../../../../domain/wallet/WalletStats";
import type {
  ContributeSavingsInput,
  CreateAccountInput,
  CreateCategoryInput,
  CreateExchangeRateInput,
  CreateInvestmentInput,
  CreateSavingsGoalInput,
  CreateTransactionInput,
  TransactionList,
  UpdateAccountInput,
  UpdateInvestmentInput,
  UpdateSavingsGoalInput,
  UpdateTransactionInput,
  WalletGateway,
} from "../../../../domain/wallet/WalletGateway";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

const accountDto: AccountDto = {
  id: "a1",
  name: "Caja",
  currency: "ARS",
  type: "cash",
  initialBalance: "0",
  isActive: true,
  createdAt: "2026-06-14T08:00:00.000Z",
  updatedAt: "2026-06-14T08:00:00.000Z",
};

const categoryDto: CategoryDto = { id: "c1", name: "Comida", type: "expense", icon: null };

const transactionDto: TransactionDto = {
  id: "tx1",
  accountId: "a1",
  categoryId: null,
  type: "expense",
  amount: "100",
  currency: "ARS",
  description: null,
  date: "2026-06-14",
  tags: [],
  createdAt: "2026-06-14T08:00:00.000Z",
};

const savingsDto: SavingsGoalDto = {
  id: "s1",
  name: "Viaje",
  targetAmount: "1000",
  currentAmount: "250",
  currency: "ARS",
  deadline: null,
  isCompleted: false,
  createdAt: "2026-06-14T08:00:00.000Z",
};

const investmentDto: InvestmentDto = {
  id: "i1",
  name: "Plazo",
  type: "plazo_fijo",
  accountId: null,
  currency: "ARS",
  investedAmount: "1000",
  currentValue: "1100",
  startDate: "2026-01-01",
  endDate: null,
  rate: null,
  notes: null,
  isActive: true,
};

const exchangeRateDto: ExchangeRateDto = {
  id: "r1",
  fromCurrency: "USD",
  toCurrency: "ARS",
  rate: "1000",
  type: "blue",
  date: "2026-06-14",
};

/**
 * Records every call so handler tests can assert routing and argument
 * forwarding without HTTP. Reads return canned data; writes return sample
 * entities built through the domain models.
 */
export class FakeWalletGateway implements WalletGateway {
  readonly calls: RecordedCall[] = [];

  private record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  // accounts
  async getAccounts(): Promise<Account[]> {
    this.record("getAccounts");
    return [accountDto];
  }
  async createAccount(input: CreateAccountInput): Promise<Account> {
    this.record("createAccount", input);
    return accountDto;
  }
  async updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    this.record("updateAccount", id, input);
    return accountDto;
  }
  async deleteAccount(id: string): Promise<void> {
    this.record("deleteAccount", id);
  }

  // categories
  async getCategories(type?: CategoryType): Promise<Category[]> {
    this.record("getCategories", type);
    return [categoryDto];
  }
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    this.record("createCategory", input);
    return categoryDto;
  }

  // transactions
  async getTransactions(params?: Partial<WalletTransactionFilters>): Promise<TransactionList> {
    this.record("getTransactions", params);
    return { transactions: [Transaction.from(transactionDto)], total: 1 };
  }
  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    this.record("createTransaction", input);
    return Transaction.from(transactionDto);
  }
  async updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    this.record("updateTransaction", id, input);
    return Transaction.from(transactionDto);
  }
  async deleteTransaction(id: string): Promise<void> {
    this.record("deleteTransaction", id);
  }

  // savings
  async getSavings(): Promise<SavingsGoal[]> {
    this.record("getSavings");
    return [SavingsGoal.from(savingsDto)];
  }
  async createSavingsGoal(input: CreateSavingsGoalInput): Promise<SavingsGoal> {
    this.record("createSavingsGoal", input);
    return SavingsGoal.from(savingsDto);
  }
  async updateSavingsGoal(id: string, input: UpdateSavingsGoalInput): Promise<SavingsGoal> {
    this.record("updateSavingsGoal", id, input);
    return SavingsGoal.from(savingsDto);
  }
  async contributeSavings(id: string, input: ContributeSavingsInput): Promise<SavingsGoal> {
    this.record("contributeSavings", id, input);
    return SavingsGoal.from(savingsDto);
  }

  // investments
  async getInvestments(): Promise<Investment[]> {
    this.record("getInvestments");
    return [Investment.from(investmentDto)];
  }
  async createInvestment(input: CreateInvestmentInput): Promise<Investment> {
    this.record("createInvestment", input);
    return Investment.from(investmentDto);
  }
  async updateInvestment(id: string, input: UpdateInvestmentInput): Promise<Investment> {
    this.record("updateInvestment", id, input);
    return Investment.from(investmentDto);
  }

  // stats
  async getStatsSummary(params?: Record<string, string>): Promise<WalletStatsSummary> {
    this.record("getStatsSummary", params);
    return { totalIncome: "0", totalExpenses: "0", netBalance: "0", transactionCount: 0 };
  }
  async getStatsByCategory(params?: Record<string, string>): Promise<CategoryStat[]> {
    this.record("getStatsByCategory", params);
    return [];
  }
  async getMonthlyTrend(): Promise<MonthlyTrend[]> {
    this.record("getMonthlyTrend");
    return [];
  }

  // exchange rates
  async getExchangeRates(): Promise<ExchangeRate[]> {
    this.record("getExchangeRates");
    return [exchangeRateDto];
  }
  async createExchangeRate(input: CreateExchangeRateInput): Promise<ExchangeRate> {
    this.record("createExchangeRate", input);
    return exchangeRateDto;
  }
}
