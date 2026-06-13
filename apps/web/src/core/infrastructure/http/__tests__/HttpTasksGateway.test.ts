import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Task } from "../../../domain/tasks/Task";
import { HttpTasksGateway } from "../HttpTasksGateway";

interface RecordedCall {
  method: HttpMethods;
  url: string;
  body: unknown;
}

class FakeHttpClient implements HttpClient {
  readonly calls: RecordedCall[] = [];
  constructor(private readonly responses: Record<string, unknown> = {}) {}

  get<T = any>(url: string) {
    return this.record<T>(HttpMethods.GET, url, undefined);
  }
  post<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.POST, url, body);
  }
  put<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PUT, url, body);
  }
  patch<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PATCH, url, body);
  }
  delete<T = any>(url: string) {
    return this.record<T>(HttpMethods.DELETE, url, undefined);
  }
  head<T = any>(url: string) {
    return this.record<T>(HttpMethods.HEAD, url, undefined);
  }
  send<T = any>(request: HttpRequest) {
    return this.record<T>(request.method, request.url, request.body);
  }
  addInterceptor() {}

  private async record<T>(method: HttpMethods, url: string, body: unknown): Promise<HttpResponse<T>> {
    this.calls.push({ method, url, body });
    return {
      method,
      url,
      status: 200,
      statusText: "OK",
      headers: {},
      body: (this.responses[`${method} ${url}`] ?? {}) as T,
      request: new HttpRequest(method, url, body),
    };
  }
}

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "t1",
    title: "Tarea",
    description: null,
    priority: 2,
    status: "pending",
    scheduledDate: "2026-06-13",
    domain: null,
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

describe("HttpTasksGateway", () => {
  it("lists tasks, mapping DTOs to domain models and passing the total", async () => {
    const http = new FakeHttpClient({
      "GET /tasks": { tasks: [taskDto()], total: 1, limit: 50, offset: 0 },
    });

    const result = await new HttpTasksGateway(http).listTasks();

    expect(result.total).toBe(1);
    expect(result.tasks[0]).toBeInstanceOf(Task);
    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/tasks" });
  });

  it("appends query params for a filtered list", async () => {
    const http = new FakeHttpClient({
      "GET /tasks?scheduledDate=2026-06-13": { tasks: [], total: 0, limit: 50, offset: 0 },
    });

    await new HttpTasksGateway(http).listTasks({ scheduledDate: "2026-06-13" });

    expect(http.calls[0].url).toBe("/tasks?scheduledDate=2026-06-13");
  });

  it("unwraps the created task from the response envelope into a model", async () => {
    const http = new FakeHttpClient({ "POST /tasks": { task: taskDto({ id: "new" }) } });

    const task = await new HttpTasksGateway(http).createTask({ title: "Nueva" });

    expect(task).toBeInstanceOf(Task);
    expect(task.id).toBe("new");
    expect(http.calls[0]).toMatchObject({ url: "/tasks", body: { title: "Nueva" } });
  });

  it("maps the completed task to a domain model", async () => {
    const http = new FakeHttpClient({ "POST /tasks/t1/complete": taskDto({ status: "done" }) });

    const task = await new HttpTasksGateway(http).completeTask("t1");

    expect(task).toBeInstanceOf(Task);
    expect(task.isDone).toBe(true);
  });

  it("sends toDate on carry-over", async () => {
    const http = new FakeHttpClient({ "POST /tasks/t1/carry-over": taskDto() });
    await new HttpTasksGateway(http).carryOverTask("t1", "2026-06-14");
    expect(http.calls[0]).toMatchObject({ url: "/tasks/t1/carry-over", body: { toDate: "2026-06-14" } });
  });

  it("getTask maps the task and passes notes through", async () => {
    const http = new FakeHttpClient({
      "GET /tasks/t1": { task: taskDto(), notes: [{ id: "n1" }] },
    });

    const details = await new HttpTasksGateway(http).getTask("t1");

    expect(details.task).toBeInstanceOf(Task);
    expect(details.notes[0].id).toBe("n1");
  });

  it("unwraps recent insights and forwards the limit", async () => {
    const http = new FakeHttpClient({ "GET /tasks/insights?limit=3": { insights: [{ id: "i1" }] } });

    const insights = await new HttpTasksGateway(http).getRecentInsights(3);

    expect(insights[0].id).toBe("i1");
    expect(http.calls[0].url).toBe("/tasks/insights?limit=3");
  });

  it("adds a note defaulting the type to note", async () => {
    const http = new FakeHttpClient({ "POST /tasks/t1/notes": { id: "n1" } });
    await new HttpTasksGateway(http).addNote("t1", "hola");
    expect(http.calls[0]).toMatchObject({
      url: "/tasks/t1/notes",
      body: { content: "hola", type: "note" },
    });
  });
});
