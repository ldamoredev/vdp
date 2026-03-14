const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Accounts
  getAccounts: () => request<any[]>("/accounts"),
  createAccount: (data: any) =>
    request<any>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: any) =>
    request<any>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAccount: (id: string) =>
    request<any>(`/accounts/${id}`, { method: "DELETE" }),

  // Categories
  getCategories: (type?: string) =>
    request<any[]>(`/categories${type ? `?type=${type}` : ""}`),
  createCategory: (data: any) =>
    request<any>("/categories", { method: "POST", body: JSON.stringify(data) }),

  // Transactions
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

  // Savings
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

  // Investments
  getInvestments: () => request<any[]>("/investments"),
  createInvestment: (data: any) =>
    request<any>("/investments", { method: "POST", body: JSON.stringify(data) }),
  updateInvestment: (id: string, data: any) =>
    request<any>(`/investments/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Stats
  getStatsSummary: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any>(`/stats/summary${qs}`);
  },
  getStatsByCategory: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any[]>(`/stats/by-category${qs}`);
  },
  getMonthlyTrend: () => request<any[]>("/stats/monthly-trend"),

  // Exchange Rates
  getExchangeRates: () => request<any[]>("/exchange-rates/latest"),
  createExchangeRate: (data: any) =>
    request<any>("/exchange-rates", { method: "POST", body: JSON.stringify(data) }),

  // Agent
  chatStream: async function* (message: string, conversationId?: string) {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId }),
    });
    if (!res.ok) throw new Error("Chat request failed");
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          try {
            yield JSON.parse(data);
          } catch {}
        }
      }
    }
  },
  getConversations: () => request<any[]>("/agent/conversations"),
  getConversationMessages: (id: string) => request<any[]>(`/agent/conversations/${id}/messages`),
};
