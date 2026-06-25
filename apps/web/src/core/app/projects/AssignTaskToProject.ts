import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Task } from "../../domain/tasks/Task";
import type { AssignTaskToProjectInput, ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class AssignTaskToProject extends Command<Task> {
  constructor(
    readonly projectId: string,
    readonly input: AssignTaskToProjectInput,
  ) {
    super();
  }
}

export class AssignTaskToProjectHandler implements RequestHandler<AssignTaskToProject, Task> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: AssignTaskToProject): Promise<Task> {
    return this.gateway.assignTaskToProject(command.projectId, command.input);
  }
}
