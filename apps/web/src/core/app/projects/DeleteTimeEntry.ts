import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class DeleteTimeEntry extends Command<boolean> {
  constructor(readonly id: string) {
    super();
  }
}

export class DeleteTimeEntryHandler implements RequestHandler<DeleteTimeEntry, boolean> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: DeleteTimeEntry): Promise<boolean> {
    return this.gateway.deleteTimeEntry(command.id);
  }
}
