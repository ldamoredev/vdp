import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Project } from "../../domain/projects/Project";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class ArchiveProject extends Command<Project> {
  constructor(readonly id: string) {
    super();
  }
}

export class ArchiveProjectHandler implements RequestHandler<ArchiveProject, Project> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: ArchiveProject): Promise<Project> {
    return this.gateway.archiveProject(command.id);
  }
}
