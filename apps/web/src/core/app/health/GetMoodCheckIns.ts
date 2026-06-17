import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway, MoodCheckInsOverview } from "../../domain/health/HealthGateway";

export class GetMoodCheckIns extends Query<MoodCheckInsOverview> {
  constructor(readonly days?: number) {
    super();
  }
}

export class GetMoodCheckInsHandler implements RequestHandler<GetMoodCheckIns, MoodCheckInsOverview> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(query: GetMoodCheckIns): Promise<MoodCheckInsOverview> {
    return this.gateway.listMoodCheckIns(query.days);
  }
}
