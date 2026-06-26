import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { ProjectsGateway, UpdateTimeEntryInput } from "../../domain/projects/ProjectsGateway";
import type { TimeEntry } from "../../domain/projects/TimeEntry";

export class UpdateTimeEntry extends Command<TimeEntry> {
  constructor(
    readonly id: string,
    readonly input: UpdateTimeEntryInput,
  ) {
    super();
  }
}

export class UpdateTimeEntryHandler implements RequestHandler<UpdateTimeEntry, TimeEntry> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: UpdateTimeEntry): Promise<TimeEntry> {
    return this.gateway.updateTimeEntry(command.id, command.input);
  }
}
