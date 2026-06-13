import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { CreateCounterInput, HealthGateway } from "../../domain/health/HealthGateway";

export class CreateCounter extends Command<void> {
  constructor(readonly input: CreateCounterInput) {
    super();
  }
}

export class CreateCounterHandler implements RequestHandler<CreateCounter, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: CreateCounter): Promise<void> {
    await this.gateway.createCounter(command.input);
  }
}
