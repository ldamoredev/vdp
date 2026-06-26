import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { ProjectHoursReport } from "../../domain/projects/TimeEntry";
import type { ProjectHoursReportFilters, ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class GetHoursReport extends Query<ProjectHoursReport> {
  constructor(readonly filters: ProjectHoursReportFilters) {
    super();
  }
}

export class GetHoursReportHandler implements RequestHandler<GetHoursReport, ProjectHoursReport> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(query: GetHoursReport): Promise<ProjectHoursReport> {
    return this.gateway.getHoursReport(query.filters);
  }
}
