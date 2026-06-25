import type { Project as ProjectDto, Task as TaskDto } from "@vdp/shared";

import { Project } from "../../../../domain/projects/Project";
import type {
  AssignTaskToProjectInput,
  CreateProjectInput,
  ProjectsGateway,
  UpdateProjectInput,
} from "../../../../domain/projects/ProjectsGateway";
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
  client: "Acme",
  status: "active",
  archivedAt: null,
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

  private record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
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
}
