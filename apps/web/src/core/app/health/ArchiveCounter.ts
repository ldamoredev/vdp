import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway } from "../../domain/health/HealthGateway";

export class ArchiveCounter extends Command<void> {
  constructor(readonly counterId: string) {
    super();
  }
}

export class ArchiveCounterHandler implements RequestHandler<ArchiveCounter, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: ArchiveCounter): Promise<void> {
    await this.gateway.archiveCounter(command.counterId);
  }
}
