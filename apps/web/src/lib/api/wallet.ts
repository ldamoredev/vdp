import { request } from "./client";
import type {
  Account,
  Transaction,
  Category,
  SavingsGoal,
  Investment,
  WalletStatsSummary,
  CategoryStat,
  MonthlyTrend,
  ExchangeRate,
  PaginatedResult,
} from "./types";

export const walletApi = {
  // ─── Accounts ────────────────────────────────────────────
  getAccounts: () => request<Account[]>("/accounts"),
  createAccount: (data: Pick<Account, "name" | "currency" | "type" | "initialBalance">) =>
    request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: Partial<Pick<Account, "name" | "isActive">>) =>
    request<Account>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAccount: (id: string) =>
    request<void>(`/accounts/${id}`, { method: "DELETE" }),

  // ─── Categories ──────────────────────────────────────────
  getCategories: (type?: string) =>
    request<Category[]>(`/categories${type ? `?type=${type}` : ""}`),
  createCategory: (data: Pick<Category, "name" | "type" | "icon">) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),

  // ─── Transactions ────────────────────────────────────────
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<PaginatedResult<Transaction>>(`/transactions${qs}`);
  },
  createTransaction: (data: {
    accountId: string;
    categoryId?: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    currency?: string;
    description?: string;
    date?: string;
    transferToAccountId?: string;
    tags?: string[];
  }) => request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    request<void>(`/transactions/${id}`, { method: "DELETE" }),

  // ─── Savings ─────────────────────────────────────────────
  getSavings: () => request<SavingsGoal[]>("/savings"),
  createSavingsGoal: (data: Pick<SavingsGoal, "name" | "targetAmount" | "currency" | "deadline">) =>
    request<SavingsGoal>("/savings", { method: "POST", body: JSON.stringify(data) }),
  updateSavingsGoal: (id: string, data: Partial<Pick<SavingsGoal, "name" | "targetAmount" | "deadline">>) =>
    request<SavingsGoal>(`/savings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  contributeSavings: (id: string, data: { amount: number; note?: string }) =>
    request<SavingsGoal>(`/savings/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ─── Investments ─────────────────────────────────────────
  getInvestments: () => request<Investment[]>("/investments"),
  createInvestment: (data: Record<string, unknown>) =>
    request<Investment>("/investments", { method: "POST", body: JSON.stringify(data) }),
  updateInvestment: (id: string, data: Record<string, unknown>) =>
    request<Investment>(`/investments/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // ─── Stats ───────────────────────────────────────────────
  getStatsSummary: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<WalletStatsSummary>(`/stats/summary${qs}`);
  },
  getStatsByCategory: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<CategoryStat[]>(`/stats/by-category${qs}`);
  },
  getMonthlyTrend: () => request<MonthlyTrend[]>("/stats/monthly-trend"),

  // ─── Exchange Rates ──────────────────────────────────────
  getExchangeRates: () => request<ExchangeRate[]>("/exchange-rates/latest"),
  createExchangeRate: (data: Pick<ExchangeRate, "fromCurrency" | "toCurrency" | "rate" | "type">) =>
    request<ExchangeRate>("/exchange-rates", { method: "POST", body: JSON.stringify(data) }),
};
