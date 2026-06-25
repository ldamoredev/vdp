import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Project } from "../../domain/projects/Project";
import type { ProjectsGateway, UpdateProjectInput } from "../../domain/projects/ProjectsGateway";

export class UpdateProject extends Command<Project> {
  constructor(
    readonly id: string,
    readonly input: UpdateProjectInput,
  ) {
    super();
  }
}

export class UpdateProjectHandler implements RequestHandler<UpdateProject, Project> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: UpdateProject): Promise<Project> {
    return this.gateway.updateProject(command.id, command.input);
  }
}
