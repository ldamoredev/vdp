import type {
  CarryOverAllResult,
  CarryOverRateResponse,
  DailyReviewState,
  DomainStat,
  TaskInsight,
  TaskReview,
  TaskStats,
  TaskTrendDay,
} from "@vdp/shared";

import type { Task } from "./Task";
import type { TaskNote, TaskNoteType } from "./TaskNote";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: number;
  scheduledDate?: string;
  domain?: string;
}

export type UpdateTaskInput = Partial<
  Pick<Task, "title" | "description" | "priority" | "scheduledDate" | "domain">
>;

export interface TaskDetails {
  task: Task;
  notes: TaskNote[];
}

export interface TaskList {
  tasks: Task[];
  total: number;
}

/**
 * Port for the tasks backend. Reads return domain models; writes that the UI
 * acts on return the affected Task (or result), the rest return void and the
 * presenter re-queries. Implemented by HttpTasksGateway; faked in tests.
 */
export interface TasksGateway {
  // CRUD
  listTasks(params?: Record<string, string>): Promise<TaskList>;
  getTask(id: string): Promise<TaskDetails>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // status transitions
  startTask(id: string): Promise<Task>;
  completeTask(id: string): Promise<Task>;
  carryOverTask(id: string, toDate?: string): Promise<Task>;
  discardTask(id: string): Promise<Task>;
  carryOverAll(fromDate: string, toDate?: string): Promise<CarryOverAllResult>;

  // review & notes
  getReview(date?: string): Promise<TaskReview>;
  getReviewState(date: string): Promise<DailyReviewState | null>;
  saveReviewState(state: DailyReviewState): Promise<DailyReviewState>;
  getRecentInsights(limit?: number): Promise<TaskInsight[]>;
  listNotes(taskId: string): Promise<TaskNote[]>;
  addNote(taskId: string, content: string, type?: TaskNoteType): Promise<TaskNote>;

  // stats
  getTodayStats(): Promise<TaskStats>;
  getTrend(days?: number): Promise<TaskTrendDay[]>;
  getByDomain(params?: Record<string, string>): Promise<DomainStat[]>;
  getCarryOverRate(days?: number): Promise<CarryOverRateResponse>;
}
