import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Objective } from "../../domain/objectives/Objective";
import type { CreateObjectiveInput, ObjectivesGateway } from "../../domain/objectives/ObjectivesGateway";

export class CreateObjective extends Command<Objective> {
  constructor(readonly input: CreateObjectiveInput) {
    super();
  }
}

export class CreateObjectiveHandler implements RequestHandler<CreateObjective, Objective> {
  constructor(private readonly gateway: ObjectivesGateway) {}

  async handle(command: CreateObjective): Promise<Objective> {
    return this.gateway.createObjective(command.input);
  }
}
