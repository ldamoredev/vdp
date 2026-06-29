import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Objective } from "../../domain/objectives/Objective";
import type { ObjectivesGateway } from "../../domain/objectives/ObjectivesGateway";

export class GetObjective extends Query<Objective | null> {
  constructor(readonly id: string) {
    super();
  }
}

export class GetObjectiveHandler implements RequestHandler<GetObjective, Objective | null> {
  constructor(private readonly gateway: ObjectivesGateway) {}

  async handle(query: GetObjective): Promise<Objective | null> {
    return this.gateway.getObjective(query.id);
  }
}
