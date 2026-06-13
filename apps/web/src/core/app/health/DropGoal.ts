import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway } from "../../domain/health/HealthGateway";

export class DropGoal extends Command<void> {
  constructor(readonly goalId: string) {
    super();
  }
}

export class DropGoalHandler implements RequestHandler<DropGoal, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: DropGoal): Promise<void> {
    await this.gateway.dropGoal(command.goalId);
  }
}
