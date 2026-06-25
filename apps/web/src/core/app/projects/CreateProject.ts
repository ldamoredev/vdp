import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Project } from "../../domain/projects/Project";
import type { CreateProjectInput, ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class CreateProject extends Command<Project> {
  constructor(readonly input: CreateProjectInput) {
    super();
  }
}

export class CreateProjectHandler implements RequestHandler<CreateProject, Project> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: CreateProject): Promise<Project> {
    return this.gateway.createProject(command.input);
  }
}
