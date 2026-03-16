import { request } from "./client";

export const walletApi = {
  // ─── Accounts ────────────────────────────────────────────
  getAccounts: () => request<any[]>("/accounts"),
  createAccount: (data: any) =>
    request<any>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: any) =>
    request<any>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAccount: (id: string) =>
    request<any>(`/accounts/${id}`, { method: "DELETE" }),

  // ─── Categories ──────────────────────────────────────────
  getCategories: (type?: string) =>
    request<any[]>(`/categories${type ? `?type=${type}` : ""}`),
  createCategory: (data: any) =>
    request<any>("/categories", { method: "POST", body: JSON.stringify(data) }),

  // ─── Transactions ────────────────────────────────────────
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: any[]; total: number }>(`/transactions${qs}`);
  },
  createTransaction: (data: any) =>
    request<any>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: any) =>
    request<any>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    request<any>(`/transactions/${id}`, { method: "DELETE" }),

  // ─── Savings ─────────────────────────────────────────────
  getSavings: () => request<any[]>("/savings"),
  createSavingsGoal: (data: any) =>
    request<any>("/savings", { method: "POST", body: JSON.stringify(data) }),
  updateSavingsGoal: (id: string, data: any) =>
    request<any>(`/savings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  contributeSavings: (id: string, data: any) =>
    request<any>(`/savings/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ─── Investments ─────────────────────────────────────────
  getInvestments: () => request<any[]>("/investments"),
  createInvestment: (data: any) =>
    request<any>("/investments", { method: "POST", body: JSON.stringify(data) }),
  updateInvestment: (id: string, data: any) =>
    request<any>(`/investments/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // ─── Stats ───────────────────────────────────────────────
  getStatsSummary: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any>(`/stats/summary${qs}`);
  },
  getStatsByCategory: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any[]>(`/stats/by-category${qs}`);
  },
  getMonthlyTrend: () => request<any[]>("/stats/monthly-trend"),

  // ─── Exchange Rates ──────────────────────────────────────
  getExchangeRates: () => request<any[]>("/exchange-rates/latest"),
  createExchangeRate: (data: any) =>
    request<any>("/exchange-rates", { method: "POST", body: JSON.stringify(data) }),
};
