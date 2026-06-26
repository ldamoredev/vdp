import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Client } from "../../domain/projects/Client";
import type { CreateClientInput, ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class CreateClient extends Command<Client> {
  constructor(readonly input: CreateClientInput) {
    super();
  }
}

export class CreateClientHandler implements RequestHandler<CreateClient, Client> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: CreateClient): Promise<Client> {
    return this.gateway.createClient(command.input);
  }
}
