import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Objective } from "../../domain/objectives/Objective";
import type { ObjectivesGateway } from "../../domain/objectives/ObjectivesGateway";

export class ArchiveObjective extends Command<Objective> {
  constructor(readonly id: string) {
    super();
  }
}

export class ArchiveObjectiveHandler implements RequestHandler<ArchiveObjective, Objective> {
  constructor(private readonly gateway: ObjectivesGateway) {}

  async handle(command: ArchiveObjective): Promise<Objective> {
    return this.gateway.archiveObjective(command.id);
  }
}
