import { HttpClient } from "@nbottarini/abstract-http-client";
import type {
  Client as ClientDto,
  Project as ProjectDto,
  ProjectHoursReport as ProjectHoursReportDto,
  Task as TaskDto,
  TimeEntry as TimeEntryDto,
} from "@vdp/shared";

import { Client } from "../../domain/projects/Client";
import { Project } from "../../domain/projects/Project";
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
} from "../../domain/projects/ProjectsGateway";
import { ProjectHoursReport, TimeEntry } from "../../domain/projects/TimeEntry";
import { Task } from "../../domain/tasks/Task";

const P = "/projects";

function withQuery(path: string, params?: object): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export class HttpProjectsGateway implements ProjectsGateway {
  constructor(private readonly http: HttpClient) {}

  async listClients(): Promise<Client[]> {
    const { body } = await this.http.get<{ clients: ClientDto[] }>(`${P}/clients`);
    return body.clients.map(Client.from);
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const { body } = await this.http.post<ClientDto>(`${P}/clients`, input);
    return Client.from(body);
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    const { body } = await this.http.put<ClientDto>(`${P}/clients/${id}`, input);
    return Client.from(body);
  }

  async archiveClient(id: string): Promise<Client> {
    const { body } = await this.http.post<ClientDto>(`${P}/clients/${id}/archive`, {});
    return Client.from(body);
  }

  async listProjects(): Promise<Project[]> {
    const { body } = await this.http.get<{ projects: ProjectDto[] }>(P);
    return body.projects.map(Project.from);
  }

  async getProject(id: string): Promise<Project | null> {
    const { body } = await this.http.get<ProjectDto | null>(`${P}/${id}`);
    return body ? Project.from(body) : null;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const { body } = await this.http.post<ProjectDto>(P, input);
    return Project.from(body);
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const { body } = await this.http.put<ProjectDto>(`${P}/${id}`, input);
    return Project.from(body);
  }

  async archiveProject(id: string): Promise<Project> {
    const { body } = await this.http.post<ProjectDto>(`${P}/${id}/archive`, {});
    return Project.from(body);
  }

  async assignTaskToProject(projectId: string, input: AssignTaskToProjectInput): Promise<Task> {
    const { body } = await this.http.post<TaskDto>(`${P}/${projectId}/tasks`, input);
    return Task.from(body);
  }

  async listTimeEntries(filters?: TimeEntryFilters): Promise<TimeEntry[]> {
    const { body } = await this.http.get<{ entries: TimeEntryDto[] }>(
      withQuery(`${P}/time-entries`, filters),
    );
    return body.entries.map(TimeEntry.from);
  }

  async logTimeEntry(input: LogTimeEntryInput): Promise<TimeEntry> {
    const { body } = await this.http.post<TimeEntryDto>(`${P}/time-entries`, input);
    return TimeEntry.from(body);
  }

  async updateTimeEntry(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry> {
    const { body } = await this.http.put<TimeEntryDto>(`${P}/time-entries/${id}`, input);
    return TimeEntry.from(body);
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const { body } = await this.http.delete<{ deleted: boolean }>(`${P}/time-entries/${id}`);
    return body.deleted;
  }

  async getHoursReport(filters: ProjectHoursReportFilters): Promise<ProjectHoursReport> {
    const { body } = await this.http.get<ProjectHoursReportDto>(
      withQuery(`${P}/hours-report`, filters),
    );
    return ProjectHoursReport.from(body);
  }
}
