import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Client } from "../../domain/projects/Client";
import type { ProjectsGateway, UpdateClientInput } from "../../domain/projects/ProjectsGateway";

export class UpdateClient extends Command<Client> {
  constructor(
    readonly id: string,
    readonly input: UpdateClientInput,
  ) {
    super();
  }
}

export class UpdateClientHandler implements RequestHandler<UpdateClient, Client> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: UpdateClient): Promise<Client> {
    return this.gateway.updateClient(command.id, command.input);
  }
}
