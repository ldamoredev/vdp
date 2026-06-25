import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Project } from "../../domain/projects/Project";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class ListProjects extends Query<Project[]> {}

export class ListProjectsHandler implements RequestHandler<ListProjects, Project[]> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(): Promise<Project[]> {
    return this.gateway.listProjects();
  }
}
