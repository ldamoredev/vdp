import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { TimeEntry } from "../../domain/projects/TimeEntry";
import type { ProjectsGateway, TimeEntryFilters } from "../../domain/projects/ProjectsGateway";

export class ListTimeEntries extends Query<TimeEntry[]> {
  constructor(readonly filters: TimeEntryFilters = {}) {
    super();
  }
}

export class ListTimeEntriesHandler implements RequestHandler<ListTimeEntries, TimeEntry[]> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(query: ListTimeEntries): Promise<TimeEntry[]> {
    return this.gateway.listTimeEntries(query.filters);
  }
}
