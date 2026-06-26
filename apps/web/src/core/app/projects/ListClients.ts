import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Client } from "../../domain/projects/Client";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class ListClients extends Query<Client[]> {}

export class ListClientsHandler implements RequestHandler<ListClients, Client[]> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(): Promise<Client[]> {
    return this.gateway.listClients();
  }
}
