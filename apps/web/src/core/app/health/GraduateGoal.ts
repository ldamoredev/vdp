import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { GraduateGoalInput, HealthGateway } from "../../domain/health/HealthGateway";

export class GraduateGoal extends Command<void> {
  constructor(readonly goalId: string, readonly input: GraduateGoalInput) {
    super();
  }
}

export class GraduateGoalHandler implements RequestHandler<GraduateGoal, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: GraduateGoal): Promise<void> {
    await this.gateway.graduateGoal(command.goalId, command.input);
  }
}
