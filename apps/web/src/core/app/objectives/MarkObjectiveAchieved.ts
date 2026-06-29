import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Objective } from "../../domain/objectives/Objective";
import type { ObjectivesGateway } from "../../domain/objectives/ObjectivesGateway";

export class MarkObjectiveAchieved extends Command<Objective> {
  constructor(readonly id: string) {
    super();
  }
}

export class MarkObjectiveAchievedHandler implements RequestHandler<MarkObjectiveAchieved, Objective> {
  constructor(private readonly gateway: ObjectivesGateway) {}

  async handle(command: MarkObjectiveAchieved): Promise<Objective> {
    return this.gateway.markObjectiveAchieved(command.id);
  }
}
