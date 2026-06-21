import { HttpClient } from "@nbottarini/abstract-http-client";
import type {
  Account as AccountDto,
  Category as CategoryDto,
  ExchangeRate as ExchangeRateDto,
  Investment as InvestmentDto,
  SavingsGoal as SavingsGoalDto,
  Transaction as TransactionDto,
  WalletTransactionListResponse,
} from "@vdp/shared";

import type { Account } from "../../domain/wallet/Account";
import type { Category, CategoryType } from "../../domain/wallet/Category";
import type { ExchangeRate } from "../../domain/wallet/ExchangeRate";
import { Investment } from "../../domain/wallet/Investment";
import { SavingsGoal } from "../../domain/wallet/SavingsGoal";
import { Transaction, type WalletTransactionFilters } from "../../domain/wallet/Transaction";
import type {
  CategoryStat,
  FoodSpendingThisWeek,
  MonthlyTrend,
  WalletStatsSummary,
} from "../../domain/wallet/WalletStats";
import type { RecurringTransaction } from "../../domain/wallet/RecurringTransaction";
import type {
  ContributeSavingsInput,
  CreateAccountInput,
  CreateCategoryInput,
  CreateExchangeRateInput,
  CreateInvestmentInput,
  CreateRecurringTransactionInput,
  CreateSavingsGoalInput,
  CreateTransactionInput,
  TransactionList,
  UpdateAccountInput,
  UpdateInvestmentInput,
  UpdateSavingsGoalInput,
  UpdateTransactionInput,
  WalletGateway,
} from "../../domain/wallet/WalletGateway";

const W = "/wallet";

function withQuery(path: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * HTTP adapter for the wallet backend: translates wire DTOs (@vdp/shared) into
 * domain models. The anti-corruption boundary — DTO shapes never leak past it.
 */
export class HttpWalletGateway implements WalletGateway {
  constructor(private readonly http: HttpClient) {}

  // ─── Accounts ────────────────────────────────────────────
  async getAccounts(): Promise<Account[]> {
    const { body } = await this.http.get<AccountDto[]>(`${W}/accounts`);
    return body;
  }

  async createAccount(input: CreateAccountInput): Promise<Account> {
    const { body } = await this.http.post<AccountDto>(`${W}/accounts`, input);
    return body;
  }

  async updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    const { body } = await this.http.put<AccountDto>(`${W}/accounts/${id}`, input);
    return body;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.http.delete(`${W}/accounts/${id}`);
  }

  // ─── Categories ──────────────────────────────────────────
  async getCategories(type?: CategoryType): Promise<Category[]> {
    const { body } = await this.http.get<CategoryDto[]>(withQuery(`${W}/categories`, { type }));
    return body;
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const { body } = await this.http.post<CategoryDto>(`${W}/categories`, input);
    return body;
  }

  // ─── Transactions ────────────────────────────────────────
  async getTransactions(params?: Partial<WalletTransactionFilters>): Promise<TransactionList> {
    const { body } = await this.http.get<WalletTransactionListResponse>(
      withQuery(`${W}/transactions`, params),
    );
    return { transactions: body.transactions.map(Transaction.from), total: body.total };
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const { body } = await this.http.post<TransactionDto>(`${W}/transactions`, input);
    return Transaction.from(body);
  }

  async updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const { body } = await this.http.put<TransactionDto>(`${W}/transactions/${id}`, input);
    return Transaction.from(body);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.http.delete(`${W}/transactions/${id}`);
  }

  // ─── Savings ─────────────────────────────────────────────
  async getSavings(): Promise<SavingsGoal[]> {
    const { body } = await this.http.get<SavingsGoalDto[]>(`${W}/savings`);
    return body.map(SavingsGoal.from);
  }

  async createSavingsGoal(input: CreateSavingsGoalInput): Promise<SavingsGoal> {
    const { body } = await this.http.post<SavingsGoalDto>(`${W}/savings`, input);
    return SavingsGoal.from(body);
  }

  async updateSavingsGoal(id: string, input: UpdateSavingsGoalInput): Promise<SavingsGoal> {
    const { body } = await this.http.put<SavingsGoalDto>(`${W}/savings/${id}`, input);
    return SavingsGoal.from(body);
  }

  async contributeSavings(id: string, input: ContributeSavingsInput): Promise<SavingsGoal> {
    const { body } = await this.http.post<SavingsGoalDto>(`${W}/savings/${id}/contribute`, input);
    return SavingsGoal.from(body);
  }

  // ─── Investments ─────────────────────────────────────────
  async getInvestments(): Promise<Investment[]> {
    const { body } = await this.http.get<InvestmentDto[]>(`${W}/investments`);
    return body.map(Investment.from);
  }

  async createInvestment(input: CreateInvestmentInput): Promise<Investment> {
    const { body } = await this.http.post<InvestmentDto>(`${W}/investments`, input);
    return Investment.from(body);
  }

  async updateInvestment(id: string, input: UpdateInvestmentInput): Promise<Investment> {
    const { body } = await this.http.put<InvestmentDto>(`${W}/investments/${id}`, input);
    return Investment.from(body);
  }

  // ─── Stats ───────────────────────────────────────────────
  async getStatsSummary(params?: Record<string, string>): Promise<WalletStatsSummary> {
    const { body } = await this.http.get<WalletStatsSummary>(
      withQuery(`${W}/stats/summary`, params),
    );
    return body;
  }

  async getStatsByCategory(params?: Record<string, string>): Promise<CategoryStat[]> {
    const { body } = await this.http.get<CategoryStat[]>(
      withQuery(`${W}/stats/by-category`, params),
    );
    return body;
  }

  async getMonthlyTrend(params?: Record<string, string>): Promise<MonthlyTrend[]> {
    const { body } = await this.http.get<MonthlyTrend[]>(
      withQuery(`${W}/stats/monthly-trend`, params),
    );
    return body;
  }

  async getFoodSpendingThisWeek(): Promise<FoodSpendingThisWeek> {
    const { body } = await this.http.get<FoodSpendingThisWeek>(`${W}/stats/food-this-week`);
    return body;
  }

  // ─── Exchange Rates ──────────────────────────────────────
  async getExchangeRates(): Promise<ExchangeRate[]> {
    const { body } = await this.http.get<ExchangeRateDto[]>(`${W}/exchange-rates/latest`);
    return body;
  }

  async createExchangeRate(input: CreateExchangeRateInput): Promise<ExchangeRate> {
    const { body } = await this.http.post<ExchangeRateDto>(`${W}/exchange-rates`, input);
    return body;
  }

  async refreshExchangeRates(): Promise<ExchangeRate[]> {
    const { body } = await this.http.post<ExchangeRateDto[]>(`${W}/exchange-rates/refresh`, {});
    return body;
  }

  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const { body } = await this.http.get<RecurringTransaction[]>(`${W}/recurring`);
    return body;
  }

  async createRecurringTransaction(input: CreateRecurringTransactionInput): Promise<RecurringTransaction> {
    const { body } = await this.http.post<RecurringTransaction>(`${W}/recurring`, input);
    return body;
  }

  async deleteRecurringTransaction(id: string): Promise<void> {
    await this.http.delete(`${W}/recurring/${id}`);
  }

  async materializeDueRecurringTransactions(): Promise<number> {
    const { body } = await this.http.post<{ created: number }>(`${W}/recurring/materialize`, {});
    return body.created;
  }
}
