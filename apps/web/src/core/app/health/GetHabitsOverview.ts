import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { HabitsOverview, HealthGateway } from "../../domain/health/HealthGateway";

export class GetHabitsOverview extends Query<HabitsOverview> {}

export class GetHabitsOverviewHandler implements RequestHandler<GetHabitsOverview, HabitsOverview> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(): Promise<HabitsOverview> {
    return this.gateway.listHabits();
  }
}
