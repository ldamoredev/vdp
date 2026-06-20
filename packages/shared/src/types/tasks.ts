import type { PaginatedCollection } from "./common";

// ─── Tasks API response shapes ───────────────────────────
//
// JSON wire shapes served by the tasks HTTP routes: dates are ISO strings.
// The server's internal domain model lives in
// `server/src/modules/tasks/domain/Task.ts`.

export type TaskStatus = "pending" | "in_progress" | "done" | "discarded";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: TaskStatus;
  scheduledDate: string;
  domain: string | null;
  carryOverCount: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskListResponse = PaginatedCollection<"tasks", Task>;

export interface TaskNote {
  id: string;
  taskId: string;
  content: string;
  type: "note" | "breakdown_step" | "blocker";
  createdAt: string;
}

export interface TaskDetailsResponse {
  task: Task;
  notes: TaskNote[];
}

export interface TaskInsightAction {
  href: string;
  label: string;
  domain: string;
}

export interface TaskInsightMetadata extends Record<string, unknown> {
  source?: string;
  domain?: string;
  actionHref?: string;
  actionLabel?: string;
  actionDomain?: string;
}

export interface TaskInsight {
  id: string;
  type: "achievement" | "warning" | "suggestion";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: TaskInsightMetadata;
  action?: TaskInsightAction;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface TaskTrendDay {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface TaskReview {
  date: string;
  total: number;
  completed: number;
  pending: number;
  carriedOver: number;
  discarded: number;
  completionRate: number;
  pendingTasks: Task[];
  allTasks: Task[];
  note?: string;
}

export interface DomainStat {
  domain: string | null;
  count: number;
}

export interface CarryOverAllResult {
  carriedOver: number;
  tasks: Task[];
}

export interface CarryOverRateResponse {
  total: number;
  carriedOver: number;
  rate: number;
  days: number;
}
