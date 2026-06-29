import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Objective } from "../../domain/objectives/Objective";
import type { ObjectivesGateway, UpdateObjectiveInput } from "../../domain/objectives/ObjectivesGateway";

export class UpdateObjective extends Command<Objective> {
  constructor(
    readonly id: string,
    readonly input: UpdateObjectiveInput,
  ) {
    super();
  }
}

export class UpdateObjectiveHandler implements RequestHandler<UpdateObjective, Objective> {
  constructor(private readonly gateway: ObjectivesGateway) {}

  async handle(command: UpdateObjective): Promise<Objective> {
    return this.gateway.updateObjective(command.id, command.input);
  }
}
