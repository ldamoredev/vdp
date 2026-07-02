import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Project } from "../../domain/projects/Project";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class UnarchiveProject extends Command<Project> {
  constructor(readonly id: string) {
    super();
  }
}

export class UnarchiveProjectHandler implements RequestHandler<UnarchiveProject, Project> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: UnarchiveProject): Promise<Project> {
    return this.gateway.unarchiveProject(command.id);
  }
}
