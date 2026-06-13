import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway } from "../../domain/health/HealthGateway";

export class RelapseCounter extends Command<void> {
  constructor(readonly counterId: string, readonly date?: string) {
    super();
  }
}

export class RelapseCounterHandler implements RequestHandler<RelapseCounter, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: RelapseCounter): Promise<void> {
    await this.gateway.relapseCounter(command.counterId, command.date);
  }
}
