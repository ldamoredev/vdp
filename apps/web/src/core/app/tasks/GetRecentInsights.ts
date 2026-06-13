import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { TaskInsight } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetRecentInsights extends Query<TaskInsight[]> {
  constructor(readonly limit?: number) {
    super();
  }
}

export class GetRecentInsightsHandler implements RequestHandler<GetRecentInsights, TaskInsight[]> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: GetRecentInsights): Promise<TaskInsight[]> {
    return this.gateway.getRecentInsights(query.limit);
  }
}
