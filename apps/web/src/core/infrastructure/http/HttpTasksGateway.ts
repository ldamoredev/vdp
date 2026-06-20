import { HttpClient } from "@nbottarini/abstract-http-client";
import type {
  CarryOverAllResult,
  CarryOverRateResponse,
  DomainStat,
  Task as TaskDto,
  TaskDetailsResponse,
  TaskInsight,
  TaskListResponse,
  TaskNote as TaskNoteDto,
  TaskReview,
  TaskStats,
  TaskTrendDay,
} from "@vdp/shared";

import { Task } from "../../domain/tasks/Task";
import type { TaskNoteType } from "../../domain/tasks/TaskNote";
import type {
  CreateTaskInput,
  TaskDetails,
  TaskList,
  TasksGateway,
  UpdateTaskInput,
} from "../../domain/tasks/TasksGateway";

function withQuery(path: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * HTTP adapter for the tasks backend: translates wire DTOs (@vdp/shared) into
 * domain models. The anti-corruption boundary — DTO shapes never leak past it.
 */
export class HttpTasksGateway implements TasksGateway {
  constructor(private readonly http: HttpClient) {}

  async listTasks(params?: Record<string, string>): Promise<TaskList> {
    const { body } = await this.http.get<TaskListResponse>(withQuery("/tasks", params));
    return { tasks: body.tasks.map(Task.from), total: body.total };
  }

  async getTask(id: string): Promise<TaskDetails> {
    const { body } = await this.http.get<TaskDetailsResponse>(`/tasks/${id}`);
    return { task: Task.from(body.task), notes: body.notes };
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const { body } = await this.http.post<{ task: TaskDto }>("/tasks", input);
    return Task.from(body.task);
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const { body } = await this.http.put<TaskDto>(`/tasks/${id}`, input);
    return Task.from(body);
  }

  async deleteTask(id: string): Promise<void> {
    await this.http.delete(`/tasks/${id}`);
  }

  async startTask(id: string): Promise<Task> {
    const { body } = await this.http.post<TaskDto>(`/tasks/${id}/start`, {});
    return Task.from(body);
  }

  async completeTask(id: string): Promise<Task> {
    const { body } = await this.http.post<TaskDto>(`/tasks/${id}/complete`, {});
    return Task.from(body);
  }

  async carryOverTask(id: string, toDate?: string): Promise<Task> {
    const { body } = await this.http.post<TaskDto>(`/tasks/${id}/carry-over`, { toDate });
    return Task.from(body);
  }

  async discardTask(id: string): Promise<Task> {
    const { body } = await this.http.post<TaskDto>(`/tasks/${id}/discard`, {});
    return Task.from(body);
  }

  async carryOverAll(fromDate: string, toDate?: string): Promise<CarryOverAllResult> {
    const { body } = await this.http.post<CarryOverAllResult>("/tasks/carry-over-all", {
      fromDate,
      toDate,
    });
    return body;
  }

  async getReview(date?: string): Promise<TaskReview> {
    const { body } = await this.http.get<TaskReview>(withQuery("/tasks/review", { date }));
    return body;
  }

  async getRecentInsights(limit = 5): Promise<TaskInsight[]> {
    const { body } = await this.http.get<{ insights: TaskInsight[] }>(
      withQuery("/tasks/insights", { limit }),
    );
    return body.insights;
  }

  async listNotes(taskId: string): Promise<TaskNoteDto[]> {
    const { body } = await this.http.get<TaskNoteDto[]>(`/tasks/${taskId}/notes`);
    return body;
  }

  async addNote(taskId: string, content: string, type: TaskNoteType = "note"): Promise<TaskNoteDto> {
    const { body } = await this.http.post<TaskNoteDto>(`/tasks/${taskId}/notes`, { content, type });
    return body;
  }

  async getTodayStats(): Promise<TaskStats> {
    const { body } = await this.http.get<TaskStats>("/tasks/stats/today");
    return body;
  }

  async getTrend(days?: number): Promise<TaskTrendDay[]> {
    const { body } = await this.http.get<TaskTrendDay[]>(withQuery("/tasks/stats/trend", { days }));
    return body;
  }

  async getByDomain(params?: Record<string, string>): Promise<DomainStat[]> {
    const { body } = await this.http.get<DomainStat[]>(withQuery("/tasks/stats/by-domain", params));
    return body;
  }

  async getCarryOverRate(days?: number): Promise<CarryOverRateResponse> {
    const { body } = await this.http.get<CarryOverRateResponse>(
      withQuery("/tasks/stats/carry-over", { days }),
    );
    return body;
  }
}
