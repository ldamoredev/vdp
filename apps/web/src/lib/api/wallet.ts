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
  WalletTransactionListResponse,
} from "./types";

const W = "/wallet";

export const walletApi = {
  // ─── Accounts ────────────────────────────────────────────
  getAccounts: () => request<Account[]>(`${W}/accounts`),
  createAccount: (data: Pick<Account, "name" | "currency" | "type" | "initialBalance">) =>
    request<Account>(`${W}/accounts`, { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: Partial<Pick<Account, "name" | "isActive">>) =>
    request<Account>(`${W}/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAccount: (id: string) =>
    request<void>(`${W}/accounts/${id}`, { method: "DELETE" }),

  // ─── Categories ──────────────────────────────────────────
  getCategories: (type?: string) =>
    request<Category[]>(`${W}/categories${type ? `?type=${type}` : ""}`),
  createCategory: (data: Pick<Category, "name" | "type" | "icon">) =>
    request<Category>(`${W}/categories`, { method: "POST", body: JSON.stringify(data) }),

  // ─── Transactions ────────────────────────────────────────
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<WalletTransactionListResponse>(`${W}/transactions${qs}`);
  },
  createTransaction: (data: {
    accountId: string;
    categoryId?: string;
    type: "income" | "expense" | "transfer";
    amount: string;
    currency: string;
    description?: string | null;
    date?: string;
    transferToAccountId?: string | null;
    tags?: string[];
  }) => request<Transaction>(`${W}/transactions`, { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`${W}/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    request<void>(`${W}/transactions/${id}`, { method: "DELETE" }),

  // ─── Savings ─────────────────────────────────────────────
  getSavings: () => request<SavingsGoal[]>(`${W}/savings`),
  createSavingsGoal: (data: Pick<SavingsGoal, "name" | "targetAmount" | "currency" | "deadline">) =>
    request<SavingsGoal>(`${W}/savings`, { method: "POST", body: JSON.stringify(data) }),
  updateSavingsGoal: (id: string, data: Partial<Pick<SavingsGoal, "name" | "targetAmount" | "deadline">>) =>
    request<SavingsGoal>(`${W}/savings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  contributeSavings: (id: string, data: { amount: string; note?: string; date?: string }) =>
    request<SavingsGoal>(`${W}/savings/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ─── Investments ─────────────────────────────────────────
  getInvestments: () => request<Investment[]>(`${W}/investments`),
  createInvestment: (data: {
    name: string;
    type: string;
    accountId?: string | null;
    currency: string;
    investedAmount: string;
    currentValue: string;
    startDate: string;
    endDate?: string | null;
    rate?: string | null;
    notes?: string | null;
  }) =>
    request<Investment>(`${W}/investments`, { method: "POST", body: JSON.stringify(data) }),
  updateInvestment: (id: string, data: Partial<{
    name: string;
    type: string;
    accountId: string | null;
    currency: string;
    investedAmount: string;
    currentValue: string;
    startDate: string;
    endDate: string | null;
    rate: string | null;
    notes: string | null;
  }>) =>
    request<Investment>(`${W}/investments/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // ─── Stats ───────────────────────────────────────────────
  getStatsSummary: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<WalletStatsSummary>(`${W}/stats/summary${qs}`);
  },
  getStatsByCategory: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<CategoryStat[]>(`${W}/stats/by-category${qs}`);
  },
  getMonthlyTrend: () => request<MonthlyTrend[]>(`${W}/stats/monthly-trend`),

  // ─── Exchange Rates ──────────────────────────────────────
  getExchangeRates: () => request<ExchangeRate[]>(`${W}/exchange-rates/latest`),
  createExchangeRate: (data: Pick<ExchangeRate, "fromCurrency" | "toCurrency" | "rate" | "type">) =>
    request<ExchangeRate>(`${W}/exchange-rates`, { method: "POST", body: JSON.stringify(data) }),
};
