import type { ProjectKind, TaskBoardStatus } from "@vdp/shared";

import type { Task } from "../tasks/Task";
import type { Project } from "./Project";

export interface CreateProjectInput {
  kind: ProjectKind;
  outcome: string;
  nextAction: string;
  focus: string;
  client?: string | null;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface AssignTaskToProjectInput {
  taskId: string;
  boardStatus?: TaskBoardStatus | null;
}

export interface ProjectsGateway {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: CreateProjectInput): Promise<Project>;
  updateProject(id: string, input: UpdateProjectInput): Promise<Project>;
  archiveProject(id: string): Promise<Project>;
  assignTaskToProject(projectId: string, input: AssignTaskToProjectInput): Promise<Task>;
}
