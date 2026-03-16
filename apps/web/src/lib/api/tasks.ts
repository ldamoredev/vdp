import { request } from "./client";

export const tasksApi = {
  // ─── CRUD ────────────────────────────────────────────────
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

  // ─── Status Transitions ─────────────────────────────────
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

  // ─── Review & Notes ─────────────────────────────────────
  getReview: (date?: string) => {
    const qs = date ? `?date=${date}` : "";
    return request<any>(`/tasks/review${qs}`);
  },
  addNote: (taskId: string, content: string) =>
    request<any>(`/tasks/${taskId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // ─── Stats ──────────────────────────────────────────────
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
};
