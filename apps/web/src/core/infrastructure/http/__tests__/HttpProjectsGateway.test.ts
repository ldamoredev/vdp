import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type {
  Client as ClientDto,
  Project as ProjectDto,
  ProjectHoursReport as ProjectHoursReportDto,
  Task as TaskDto,
  TimeEntry as TimeEntryDto,
} from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Client } from "../../../domain/projects/Client";
import { Project } from "../../../domain/projects/Project";
import { ProjectHoursReport, TimeEntry } from "../../../domain/projects/TimeEntry";
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
    clientId: "c1",
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

function clientDto(overrides: Partial<ClientDto> = {}): ClientDto {
  return {
    id: "c1",
    name: "Acme",
    status: "active",
    archivedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

function timeEntryDto(overrides: Partial<TimeEntryDto> = {}): TimeEntryDto {
  return {
    id: "te1",
    projectId: "p1",
    taskId: null,
    date: "2026-06-13",
    minutes: 90,
    note: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

function hoursReportDto(overrides: Partial<ProjectHoursReportDto> = {}): ProjectHoursReportDto {
  return {
    fromDate: "2026-06-01",
    toDate: "2026-06-30",
    totalMinutes: 90,
    rows: [
      {
        clientId: "c1",
        clientName: "Acme",
        projectId: "p1",
        projectOutcome: "Ship D3a",
        weekStart: "2026-06-08",
        minutes: 90,
      },
    ],
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

  it("lists clients and maps DTOs to domain models", async () => {
    const http = new FakeHttpClient({ "GET /projects/clients": { clients: [clientDto()] } });

    const clients = await new HttpProjectsGateway(http).listClients();

    expect(clients[0]).toBeInstanceOf(Client);
    expect(clients[0].name).toBe("Acme");
    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/projects/clients" });
  });

  it("creates, updates and archives clients", async () => {
    const http = new FakeHttpClient({
      "POST /projects/clients": clientDto({ id: "created" }),
      "PUT /projects/clients/c1": clientDto({ name: "Renamed" }),
      "POST /projects/clients/c1/archive": clientDto({ status: "archived", archivedAt: "2026-06-13T09:00:00.000Z" }),
    });
    const gateway = new HttpProjectsGateway(http);

    const created = await gateway.createClient({ name: "Acme" });
    const updated = await gateway.updateClient("c1", { name: "Renamed" });
    const archived = await gateway.archiveClient("c1");

    expect(created.id).toBe("created");
    expect(updated.name).toBe("Renamed");
    expect(archived.status).toBe("archived");
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/projects/clients", body: { name: "Acme" } });
    expect(http.calls[1]).toMatchObject({ method: "PUT", url: "/projects/clients/c1", body: { name: "Renamed" } });
    expect(http.calls[2]).toMatchObject({ method: "POST", url: "/projects/clients/c1/archive", body: {} });
  });

  it("lists time entries with query filters", async () => {
    const http = new FakeHttpClient({
      "GET /projects/time-entries?projectId=p1&fromDate=2026-06-01&toDate=2026-06-30": {
        entries: [timeEntryDto()],
      },
    });

    const entries = await new HttpProjectsGateway(http).listTimeEntries({
      projectId: "p1",
      fromDate: "2026-06-01",
      toDate: "2026-06-30",
    });

    expect(entries[0]).toBeInstanceOf(TimeEntry);
    expect(http.calls[0]).toMatchObject({
      method: "GET",
      url: "/projects/time-entries?projectId=p1&fromDate=2026-06-01&toDate=2026-06-30",
    });
  });

  it("logs, updates and deletes time entries", async () => {
    const http = new FakeHttpClient({
      "POST /projects/time-entries": timeEntryDto({ id: "logged" }),
      "PUT /projects/time-entries/te1": timeEntryDto({ minutes: 120 }),
      "DELETE /projects/time-entries/te1": { deleted: true },
    });
    const gateway = new HttpProjectsGateway(http);

    const logged = await gateway.logTimeEntry({ projectId: "p1", date: "2026-06-13", minutes: 90 });
    const updated = await gateway.updateTimeEntry("te1", { minutes: 120 });
    const deleted = await gateway.deleteTimeEntry("te1");

    expect(logged.id).toBe("logged");
    expect(updated.minutes).toBe(120);
    expect(deleted).toBe(true);
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/projects/time-entries" });
    expect(http.calls[1]).toMatchObject({ method: "PUT", url: "/projects/time-entries/te1", body: { minutes: 120 } });
    expect(http.calls[2]).toMatchObject({ method: "DELETE", url: "/projects/time-entries/te1" });
  });

  it("fetches the hours report with query filters", async () => {
    const http = new FakeHttpClient({
      "GET /projects/hours-report?fromDate=2026-06-01&toDate=2026-06-30": hoursReportDto(),
    });

    const report = await new HttpProjectsGateway(http).getHoursReport({
      fromDate: "2026-06-01",
      toDate: "2026-06-30",
    });

    expect(report).toBeInstanceOf(ProjectHoursReport);
    expect(report.totalMinutes).toBe(90);
    expect(http.calls[0]).toMatchObject({
      method: "GET",
      url: "/projects/hours-report?fromDate=2026-06-01&toDate=2026-06-30",
    });
  });
});
