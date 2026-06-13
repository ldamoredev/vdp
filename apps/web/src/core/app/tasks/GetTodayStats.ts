import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { TaskStats } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetTodayStats extends Query<TaskStats> {}

export class GetTodayStatsHandler implements RequestHandler<GetTodayStats, TaskStats> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(): Promise<TaskStats> {
    return this.gateway.getTodayStats();
  }
}
