import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { CreateGoalInput, HealthGateway } from "../../domain/health/HealthGateway";

export class CreateGoal extends Command<void> {
  constructor(readonly input: CreateGoalInput) {
    super();
  }
}

export class CreateGoalHandler implements RequestHandler<CreateGoal, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: CreateGoal): Promise<void> {
    await this.gateway.createGoal(command.input);
  }
}
