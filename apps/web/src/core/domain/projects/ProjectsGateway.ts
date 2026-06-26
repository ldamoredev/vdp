import type { ProjectKind, TaskBoardStatus } from "@vdp/shared";

import type { Task } from "../tasks/Task";
import type { Client } from "./Client";
import type { Project } from "./Project";
import type { ProjectHoursReport, TimeEntry } from "./TimeEntry";

export interface CreateProjectInput {
  kind: ProjectKind;
  outcome: string;
  nextAction: string;
  focus: string;
  clientId?: string | null;
  client?: string | null;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface AssignTaskToProjectInput {
  taskId: string;
  boardStatus?: TaskBoardStatus | null;
}

export interface CreateClientInput {
  name: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export interface LogTimeEntryInput {
  projectId: string;
  taskId?: string | null;
  date: string;
  minutes: number;
  note?: string | null;
}

export type UpdateTimeEntryInput = Partial<LogTimeEntryInput>;

export interface TimeEntryFilters {
  projectId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ProjectHoursReportFilters {
  fromDate: string;
  toDate: string;
  projectId?: string;
  clientId?: string;
}

export interface ProjectsGateway {
  listClients(): Promise<Client[]>;
  createClient(input: CreateClientInput): Promise<Client>;
  updateClient(id: string, input: UpdateClientInput): Promise<Client>;
  archiveClient(id: string): Promise<Client>;
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: CreateProjectInput): Promise<Project>;
  updateProject(id: string, input: UpdateProjectInput): Promise<Project>;
  archiveProject(id: string): Promise<Project>;
  assignTaskToProject(projectId: string, input: AssignTaskToProjectInput): Promise<Task>;
  listTimeEntries(filters?: TimeEntryFilters): Promise<TimeEntry[]>;
  logTimeEntry(input: LogTimeEntryInput): Promise<TimeEntry>;
  updateTimeEntry(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry>;
  deleteTimeEntry(id: string): Promise<boolean>;
  getHoursReport(filters: ProjectHoursReportFilters): Promise<ProjectHoursReport>;
}
