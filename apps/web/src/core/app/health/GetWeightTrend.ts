import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway, WeightTrendOverview } from "../../domain/health/HealthGateway";

export class GetWeightTrend extends Query<WeightTrendOverview> {
  constructor(readonly days?: number) {
    super();
  }
}

export class GetWeightTrendHandler implements RequestHandler<GetWeightTrend, WeightTrendOverview> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(query: GetWeightTrend): Promise<WeightTrendOverview> {
    return this.gateway.getWeightTrend(query.days);
  }
}
