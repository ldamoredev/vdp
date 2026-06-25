import { HttpClient } from "@nbottarini/abstract-http-client";
import type { Project as ProjectDto, Task as TaskDto } from "@vdp/shared";

import { Project } from "../../domain/projects/Project";
import type {
  AssignTaskToProjectInput,
  CreateProjectInput,
  ProjectsGateway,
  UpdateProjectInput,
} from "../../domain/projects/ProjectsGateway";
import { Task } from "../../domain/tasks/Task";

export class HttpProjectsGateway implements ProjectsGateway {
  constructor(private readonly http: HttpClient) {}

  async listProjects(): Promise<Project[]> {
    const { body } = await this.http.get<{ projects: ProjectDto[] }>("/projects");
    return body.projects.map(Project.from);
  }

  async getProject(id: string): Promise<Project | null> {
    const { body } = await this.http.get<ProjectDto | null>(`/projects/${id}`);
    return body ? Project.from(body) : null;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const { body } = await this.http.post<ProjectDto>("/projects", input);
    return Project.from(body);
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const { body } = await this.http.put<ProjectDto>(`/projects/${id}`, input);
    return Project.from(body);
  }

  async archiveProject(id: string): Promise<Project> {
    const { body } = await this.http.post<ProjectDto>(`/projects/${id}/archive`, {});
    return Project.from(body);
  }

  async assignTaskToProject(projectId: string, input: AssignTaskToProjectInput): Promise<Task> {
    const { body } = await this.http.post<TaskDto>(`/projects/${projectId}/tasks`, input);
    return Task.from(body);
  }
}
