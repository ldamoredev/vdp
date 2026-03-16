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
  // ─── Tasks CRUD ───────────────────────────────────────────
  getTasks: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: any[]; total: number }>(`/tasks${qs}`);
  },
  getTask: (id: string) => request<any>(`/tasks/${id}`),
  createTask: (data: {
    title: string;
    description?: string;
    priority?: number;
    scheduledDate?: string;
    domain?: string;
  }) => request<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    request<any>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<any>(`/tasks/${id}`, { method: "DELETE" }),

  // ─── Status Transitions ───────────────────────────────────
  completeTask: (id: string) =>
    request<any>(`/tasks/${id}/complete`, { method: "POST" }),
  carryOverTask: (id: string, toDate?: string) =>
    request<any>(`/tasks/${id}/carry-over`, {
      method: "POST",
      body: JSON.stringify({ toDate }),
    }),
  discardTask: (id: string) =>
    request<any>(`/tasks/${id}/discard`, { method: "POST" }),
  carryOverAll: (fromDate: string, toDate?: string) =>
    request<any>("/tasks/carry-over-all", {
      method: "POST",
      body: JSON.stringify({ fromDate, toDate }),
    }),

  // ─── Review & Notes ───────────────────────────────────────
  getReview: (date?: string) => {
    const qs = date ? `?date=${date}` : "";
    return request<any>(`/tasks/review${qs}`);
  },
  addNote: (taskId: string, content: string) =>
    request<any>(`/tasks/${taskId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // ─── Stats ────────────────────────────────────────────────
  getTodayStats: () => request<any>("/tasks/stats/today"),
  getTrend: (days?: number) => {
    const qs = days ? `?days=${days}` : "";
    return request<any[]>(`/tasks/stats/trend${qs}`);
  },
  getByDomain: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any[]>(`/tasks/stats/by-domain${qs}`);
  },
  getCarryOverRate: (days?: number) => {
    const qs = days ? `?days=${days}` : "";
    return request<any>(`/tasks/stats/carry-over${qs}`);
  },

  // ─── Agent ────────────────────────────────────────────────
  chatStream: async function* (message: string, conversationId?: string) {
    const res = await fetch(`${API_BASE}/tasks/agent/chat`, {
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
  getConversations: () => request<any[]>("/tasks/agent/conversations"),
  getConversationMessages: (id: string) =>
    request<any[]>(`/tasks/agent/conversations/${id}/messages`),
};
