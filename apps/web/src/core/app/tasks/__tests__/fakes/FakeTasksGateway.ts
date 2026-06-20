import type {
  CarryOverAllResult,
  CarryOverRateResponse,
  DomainStat,
  Task as TaskDto,
  TaskInsight,
  TaskReview,
  TaskStats,
  TaskTrendDay,
} from "@vdp/shared";

import { Task } from "../../../../domain/tasks/Task";
import type { TaskNote, TaskNoteType } from "../../../../domain/tasks/TaskNote";
import type {
  CreateTaskInput,
  TaskDetails,
  TaskList,
  TasksGateway,
  UpdateTaskInput,
} from "../../../../domain/tasks/TasksGateway";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

const sampleDto: TaskDto = {
  id: "t1",
  title: "Tarea",
  description: null,
  priority: 1,
  status: "pending",
  scheduledDate: "2026-06-13",
  domain: null,
  carryOverCount: 0,
  completedAt: null,
  createdAt: "2026-06-13T08:00:00.000Z",
  updatedAt: "2026-06-13T08:00:00.000Z",
};

const sampleNote: TaskNote = {
  id: "n1",
  taskId: "t1",
  content: "nota",
  type: "note",
  createdAt: "2026-06-13T08:00:00.000Z",
};

/**
 * Records every call so handler tests can assert routing and argument
 * forwarding without HTTP. Reads return canned data; writes return a sample
 * Task built through the domain model.
 */
export class FakeTasksGateway implements TasksGateway {
  readonly calls: RecordedCall[] = [];

  private record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  async listTasks(params?: Record<string, string>): Promise<TaskList> {
    this.record("listTasks", params);
    return { tasks: [Task.from(sampleDto)], total: 1 };
  }
  async getTask(id: string): Promise<TaskDetails> {
    this.record("getTask", id);
    return { task: Task.from(sampleDto), notes: [sampleNote] };
  }
  async createTask(input: CreateTaskInput): Promise<Task> {
    this.record("createTask", input);
    return Task.from(sampleDto);
  }
  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    this.record("updateTask", id, input);
    return Task.from(sampleDto);
  }
  async deleteTask(id: string): Promise<void> {
    this.record("deleteTask", id);
  }
  async startTask(id: string): Promise<Task> {
    this.record("startTask", id);
    return Task.from({ ...sampleDto, status: "in_progress" });
  }
  async completeTask(id: string): Promise<Task> {
    this.record("completeTask", id);
    return Task.from({ ...sampleDto, status: "done" });
  }
  async carryOverTask(id: string, toDate?: string): Promise<Task> {
    this.record("carryOverTask", id, toDate);
    return Task.from(sampleDto);
  }
  async discardTask(id: string): Promise<Task> {
    this.record("discardTask", id);
    return Task.from({ ...sampleDto, status: "discarded" });
  }
  async carryOverAll(fromDate: string, toDate?: string): Promise<CarryOverAllResult> {
    this.record("carryOverAll", fromDate, toDate);
    return { carriedOver: 0, tasks: [] };
  }
  async getReview(date?: string): Promise<TaskReview> {
    this.record("getReview", date);
    return {
      date: date ?? "2026-06-13",
      total: 0,
      completed: 0,
      pending: 0,
      carriedOver: 0,
      discarded: 0,
      completionRate: 0,
      pendingTasks: [],
      allTasks: [],
    };
  }
  async getRecentInsights(limit?: number): Promise<TaskInsight[]> {
    this.record("getRecentInsights", limit);
    return [];
  }
  async listNotes(taskId: string): Promise<TaskNote[]> {
    this.record("listNotes", taskId);
    return [sampleNote];
  }
  async addNote(taskId: string, content: string, type?: TaskNoteType): Promise<TaskNote> {
    this.record("addNote", taskId, content, type);
    return sampleNote;
  }
  async getTodayStats(): Promise<TaskStats> {
    this.record("getTodayStats");
    return { total: 0, completed: 0, pending: 0, completionRate: 0 };
  }
  async getTrend(days?: number): Promise<TaskTrendDay[]> {
    this.record("getTrend", days);
    return [];
  }
  async getByDomain(params?: Record<string, string>): Promise<DomainStat[]> {
    this.record("getByDomain", params);
    return [];
  }
  async getCarryOverRate(days?: number): Promise<CarryOverRateResponse> {
    this.record("getCarryOverRate", days);
    return { total: 0, carriedOver: 0, rate: 0, days: days ?? 7 };
  }
}
