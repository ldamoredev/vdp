import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { ObjectivesGateway, ObjectivesOverview } from "../../domain/objectives/ObjectivesGateway";

export class GetObjectivesOverview extends Query<ObjectivesOverview> {}

export class GetObjectivesOverviewHandler implements RequestHandler<GetObjectivesOverview, ObjectivesOverview> {
  constructor(private readonly gateway: ObjectivesGateway) {}

  async handle(): Promise<ObjectivesOverview> {
    return this.gateway.getObjectivesOverview();
  }
}
