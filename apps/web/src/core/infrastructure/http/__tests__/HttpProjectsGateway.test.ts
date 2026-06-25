import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type { Project as ProjectDto, Task as TaskDto } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Project } from "../../../domain/projects/Project";
import { Task } from "../../../domain/tasks/Task";
import { HttpProjectsGateway } from "../HttpProjectsGateway";

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

function projectDto(overrides: Partial<ProjectDto> = {}): ProjectDto {
  return {
    id: "p1",
    kind: "work",
    outcome: "Ship D3a",
    nextAction: "Wire board",
    focus: "Projects",
    client: "Acme",
    status: "active",
    archivedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
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
    projectId: "p1",
    boardStatus: "doing",
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

describe("HttpProjectsGateway", () => {
  it("lists projects and maps DTOs to domain models", async () => {
    const http = new FakeHttpClient({ "GET /projects": { projects: [projectDto()] } });

    const projects = await new HttpProjectsGateway(http).listProjects();

    expect(projects[0]).toBeInstanceOf(Project);
    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/projects" });
  });

  it("creates and updates projects with the expected body", async () => {
    const http = new FakeHttpClient({
      "POST /projects": projectDto({ id: "created" }),
      "PUT /projects/p1": projectDto({ focus: "New focus" }),
    });
    const gateway = new HttpProjectsGateway(http);

    const created = await gateway.createProject({
      kind: "work",
      outcome: "Outcome",
      nextAction: "Next",
      focus: "Focus",
    });
    const updated = await gateway.updateProject("p1", { focus: "New focus" });

    expect(created.id).toBe("created");
    expect(updated.focus).toBe("New focus");
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/projects" });
    expect(http.calls[1]).toMatchObject({ method: "PUT", url: "/projects/p1", body: { focus: "New focus" } });
  });

  it("archives a project", async () => {
    const http = new FakeHttpClient({
      "POST /projects/p1/archive": projectDto({ status: "archived", archivedAt: "2026-06-13T09:00:00.000Z" }),
    });

    const project = await new HttpProjectsGateway(http).archiveProject("p1");

    expect(project.status).toBe("archived");
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/projects/p1/archive", body: {} });
  });

  it("assigns a task to a project board column", async () => {
    const http = new FakeHttpClient({ "POST /projects/p1/tasks": taskDto() });

    const task = await new HttpProjectsGateway(http).assignTaskToProject("p1", {
      taskId: "t1",
      boardStatus: "doing",
    });

    expect(task).toBeInstanceOf(Task);
    expect(http.calls[0]).toMatchObject({
      method: "POST",
      url: "/projects/p1/tasks",
      body: { taskId: "t1", boardStatus: "doing" },
    });
  });
});
