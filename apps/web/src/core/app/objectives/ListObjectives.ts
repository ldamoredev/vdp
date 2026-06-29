import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Objective } from "../../domain/objectives/Objective";
import type { ObjectivesGateway } from "../../domain/objectives/ObjectivesGateway";

export class ListObjectives extends Query<Objective[]> {}

export class ListObjectivesHandler implements RequestHandler<ListObjectives, Objective[]> {
  constructor(private readonly gateway: ObjectivesGateway) {}

  async handle(): Promise<Objective[]> {
    return this.gateway.listObjectives();
  }
}
