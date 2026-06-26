import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { ProjectsGateway, LogTimeEntryInput } from "../../domain/projects/ProjectsGateway";
import type { TimeEntry } from "../../domain/projects/TimeEntry";

export class LogTimeEntry extends Command<TimeEntry> {
  constructor(readonly input: LogTimeEntryInput) {
    super();
  }
}

export class LogTimeEntryHandler implements RequestHandler<LogTimeEntry, TimeEntry> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: LogTimeEntry): Promise<TimeEntry> {
    return this.gateway.logTimeEntry(command.input);
  }
}
