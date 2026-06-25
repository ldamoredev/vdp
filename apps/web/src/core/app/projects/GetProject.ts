import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Project } from "../../domain/projects/Project";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class GetProject extends Query<Project | null> {
  constructor(readonly id: string) {
    super();
  }
}

export class GetProjectHandler implements RequestHandler<GetProject, Project | null> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(query: GetProject): Promise<Project | null> {
    return this.gateway.getProject(query.id);
  }
}
