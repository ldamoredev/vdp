import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { TaskTrendDay } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetTaskTrend extends Query<TaskTrendDay[]> {
  constructor(readonly days?: number) {
    super();
  }
}

export class GetTaskTrendHandler implements RequestHandler<GetTaskTrend, TaskTrendDay[]> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: GetTaskTrend): Promise<TaskTrendDay[]> {
    return this.gateway.getTrend(query.days);
  }
}
