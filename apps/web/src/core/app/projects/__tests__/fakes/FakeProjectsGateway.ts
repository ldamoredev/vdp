import type {
  Client as ClientDto,
  Project as ProjectDto,
  ProjectHoursReport as ProjectHoursReportDto,
  Task as TaskDto,
  TimeEntry as TimeEntryDto,
} from "@vdp/shared";

import { Client } from "../../../../domain/projects/Client";
import { Project } from "../../../../domain/projects/Project";
import type {
  AssignTaskToProjectInput,
  CreateClientInput,
  CreateProjectInput,
  LogTimeEntryInput,
  ProjectHoursReportFilters,
  ProjectsGateway,
  TimeEntryFilters,
  UpdateClientInput,
  UpdateProjectInput,
  UpdateTimeEntryInput,
} from "../../../../domain/projects/ProjectsGateway";
import { ProjectHoursReport, TimeEntry } from "../../../../domain/projects/TimeEntry";
import { Task } from "../../../../domain/tasks/Task";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

const projectDto: ProjectDto = {
  id: "p1",
  kind: "work",
  outcome: "Ship D3a",
  nextAction: "Wire board",
  focus: "Projects",
  clientId: "c1",
  client: "Acme",
  hourlyRate: "100.00",
  rateCurrency: "USD",
  status: "active",
  archivedAt: null,
  createdAt: "2026-06-13T08:00:00.000Z",
  updatedAt: "2026-06-13T08:00:00.000Z",
};

const clientDto: ClientDto = {
  id: "c1",
  name: "Acme",
  status: "active",
  archivedAt: null,
  createdAt: "2026-06-13T08:00:00.000Z",
  updatedAt: "2026-06-13T08:00:00.000Z",
};

const timeEntryDto: TimeEntryDto = {
  id: "te1",
  projectId: "p1",
  taskId: null,
  date: "2026-06-13",
  minutes: 90,
  note: null,
  createdAt: "2026-06-13T08:00:00.000Z",
  updatedAt: "2026-06-13T08:00:00.000Z",
};

const taskDto: TaskDto = {
  id: "t1",
  title: "Tarea",
  description: null,
  priority: 1,
  status: "pending",
  scheduledDate: "2026-06-13",
  domain: null,
  projectId: "p1",
  boardStatus: "doing",
  carryOverCount: 0,
  completedAt: null,
  createdAt: "2026-06-13T08:00:00.000Z",
  updatedAt: "2026-06-13T08:00:00.000Z",
};

export class FakeProjectsGateway implements ProjectsGateway {
  readonly calls: RecordedCall[] = [];
  projects = [Project.from(projectDto)];
  clients = [Client.from(clientDto)];
  timeEntries = [TimeEntry.from(timeEntryDto)];

  private record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  async listClients(): Promise<Client[]> {
    this.record("listClients");
    return this.clients;
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    this.record("createClient", input);
    const client = Client.from({ ...clientDto, ...input, id: "created" });
    this.clients = [client, ...this.clients];
    return client;
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    this.record("updateClient", id, input);
    return Client.from({ ...clientDto, ...input, id });
  }

  async archiveClient(id: string): Promise<Client> {
    this.record("archiveClient", id);
    return Client.from({ ...clientDto, id, status: "archived", archivedAt: "2026-06-13T09:00:00.000Z" });
  }

  async listProjects(): Promise<Project[]> {
    this.record("listProjects");
    return this.projects;
  }

  async getProject(id: string): Promise<Project | null> {
    this.record("getProject", id);
    return this.projects.find((project) => project.id === id) ?? null;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    this.record("createProject", input);
    const project = Project.from({ ...projectDto, ...input, id: "created" });
    this.projects = [project, ...this.projects];
    return project;
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    this.record("updateProject", id, input);
    return Project.from({ ...projectDto, ...input, id });
  }

  async archiveProject(id: string): Promise<Project> {
    this.record("archiveProject", id);
    return Project.from({ ...projectDto, id, status: "archived", archivedAt: "2026-06-13T09:00:00.000Z" });
  }

  async assignTaskToProject(projectId: string, input: AssignTaskToProjectInput): Promise<Task> {
    this.record("assignTaskToProject", projectId, input);
    return Task.from({ ...taskDto, projectId, boardStatus: input.boardStatus ?? "backlog" });
  }

  async listTimeEntries(filters?: TimeEntryFilters): Promise<TimeEntry[]> {
    this.record("listTimeEntries", filters);
    return this.timeEntries;
  }

  async logTimeEntry(input: LogTimeEntryInput): Promise<TimeEntry> {
    this.record("logTimeEntry", input);
    const entry = TimeEntry.from({ ...timeEntryDto, ...input, id: "logged" });
    this.timeEntries = [entry, ...this.timeEntries];
    return entry;
  }

  async updateTimeEntry(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry> {
    this.record("updateTimeEntry", id, input);
    return TimeEntry.from({ ...timeEntryDto, ...input, id });
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    this.record("deleteTimeEntry", id);
    this.timeEntries = this.timeEntries.filter((entry) => entry.id !== id);
    return true;
  }

  async getHoursReport(filters: ProjectHoursReportFilters): Promise<ProjectHoursReport> {
    this.record("getHoursReport", filters);
    const dto: ProjectHoursReportDto = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      totalMinutes: 90,
      incomeTotals: [{ amount: "150.00", currency: "USD" }],
      rows: [
        {
          clientId: "c1",
          clientName: "Acme",
          projectId: "p1",
          projectOutcome: "Ship D3a",
          weekStart: "2026-06-08",
          minutes: 90,
          expectedIncome: { amount: "150.00", currency: "USD" },
        },
      ],
    };
    return ProjectHoursReport.from(dto);
  }
}
