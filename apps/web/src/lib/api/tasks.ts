import { request, withQueryParams } from "./client";
import type {
  CarryOverAllResult,
  CarryOverRateResponse,
  DomainStat,
  TaskInsight,
  Task,
  TaskDetailsResponse,
  TaskListResponse,
  TaskNote,
  TaskReview,
  TaskStats,
  TaskTrendDay,
} from "./types";

export const tasksApi = {
  // ─── CRUD ────────────────────────────────────────────────
  getTasks: (params?: Record<string, string>) =>
    request<TaskListResponse>(withQueryParams("/tasks", params)),
  getTask: (id: string) => request<TaskDetailsResponse>(`/tasks/${id}`),
  createTask: (data: {
    title: string;
    description?: string;
    priority?: number;
    scheduledDate?: string;
    domain?: string;
  }) =>
    request<{ task: Task; similarTasks?: unknown[] }>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => res.task),
  updateTask: (id: string, data: Partial<Pick<Task, "title" | "description" | "priority" | "scheduledDate" | "domain">>) =>
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
  getReview: (date?: string) =>
    request<TaskReview>(withQueryParams("/tasks/review", { date })),
  getRecentInsights: (limit = 5) =>
    request<{ insights: TaskInsight[] }>(
      withQueryParams("/tasks/insights", { limit }),
    ).then((res) => res.insights),
  getTaskNotes: (taskId: string) => request<TaskNote[]>(`/tasks/${taskId}/notes`),
  addNote: (taskId: string, content: string, type: TaskNote["type"] = "note") =>
    request<TaskNote>(`/tasks/${taskId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, type }),
    }),

  // ─── Stats ──────────────────────────────────────────────
  getTodayStats: () => request<TaskStats>("/tasks/stats/today"),
  getTrend: (days?: number) =>
    request<TaskTrendDay[]>(withQueryParams("/tasks/stats/trend", { days })),
  getByDomain: (params?: Record<string, string>) =>
    request<DomainStat[]>(withQueryParams("/tasks/stats/by-domain", params)),
  getCarryOverRate: (days?: number) =>
    request<CarryOverRateResponse>(
      withQueryParams("/tasks/stats/carry-over", { days }),
    ),
};
