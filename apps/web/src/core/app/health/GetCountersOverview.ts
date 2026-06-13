import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { CountersOverview, HealthGateway } from "../../domain/health/HealthGateway";

export class GetCountersOverview extends Query<CountersOverview> {}

export class GetCountersOverviewHandler implements RequestHandler<GetCountersOverview, CountersOverview> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(): Promise<CountersOverview> {
    return this.gateway.listCounters();
  }
}
