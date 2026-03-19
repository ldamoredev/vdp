import { request } from "./client";
import type {
  CarryOverAllResult,
  DomainStat,
  Task,
  TaskListResponse,
  TaskReview,
  TaskStats,
  TaskTrendDay,
} from "./types";

export const tasksApi = {
  // ─── CRUD ────────────────────────────────────────────────
  getTasks: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<TaskListResponse>(`/tasks${qs}`);
  },
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (data: {
    title: string;
    description?: string;
    priority?: number;
    scheduledDate?: string;
    domain?: string;
  }) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Pick<Task, "title" | "description" | "priority" | "scheduledDate" | "domain" | "status">>) =>
    request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, { method: "DELETE" }),

  // ─── Status Transitions ─────────────────────────────────
  completeTask: (id: string) =>
    request<Task>(`/tasks/${id}/complete`, { method: "POST" }),
  carryOverTask: (id: string, toDate?: string) =>
    request<Task>(`/tasks/${id}/carry-over`, {
      method: "POST",
      body: JSON.stringify({ toDate }),
    }),
  discardTask: (id: string) =>
    request<Task>(`/tasks/${id}/discard`, { method: "POST" }),
  carryOverAll: (fromDate: string, toDate?: string) =>
    request<CarryOverAllResult>("/tasks/carry-over-all", {
      method: "POST",
      body: JSON.stringify({ fromDate, toDate }),
    }),

  // ─── Review & Notes ─────────────────────────────────────
  getReview: (date?: string) => {
    const qs = date ? `?date=${date}` : "";
    return request<TaskReview>(`/tasks/review${qs}`);
  },
  addNote: (taskId: string, content: string) =>
    request<{ id: string }>(`/tasks/${taskId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // ─── Stats ──────────────────────────────────────────────
  getTodayStats: () => request<TaskStats>("/tasks/stats/today"),
  getTrend: (days?: number) => {
    const qs = days ? `?days=${days}` : "";
    return request<TaskTrendDay[]>(`/tasks/stats/trend${qs}`);
  },
  getByDomain: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<DomainStat[]>(`/tasks/stats/by-domain${qs}`);
  },
  getCarryOverRate: (days?: number) => {
    const qs = days ? `?days=${days}` : "";
    return request<{ rate: number; total: number }>(`/tasks/stats/carry-over${qs}`);
  },
};
