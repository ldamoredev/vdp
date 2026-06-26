import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Client } from "../../domain/projects/Client";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";

export class ArchiveClient extends Command<Client> {
  constructor(readonly id: string) {
    super();
  }
}

export class ArchiveClientHandler implements RequestHandler<ArchiveClient, Client> {
  constructor(private readonly gateway: ProjectsGateway) {}

  async handle(command: ArchiveClient): Promise<Client> {
    return this.gateway.archiveClient(command.id);
  }
}
