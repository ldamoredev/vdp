import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { GoalsOverview, HealthGateway } from "../../domain/health/HealthGateway";

export class GetGoalsOverview extends Query<GoalsOverview> {}

export class GetGoalsOverviewHandler implements RequestHandler<GetGoalsOverview, GoalsOverview> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(): Promise<GoalsOverview> {
    return this.gateway.listGoals();
  }
}
