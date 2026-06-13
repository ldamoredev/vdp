import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Goal } from "../../domain/health/Goal";
import type { HealthGateway } from "../../domain/health/HealthGateway";

/**
 * Returns the completed Goal because the graduation flow offers turning it into
 * a habit right after, and needs its id/title without a re-query.
 */
export class CompleteGoal extends Command<Goal> {
  constructor(readonly goalId: string) {
    super();
  }
}

export class CompleteGoalHandler implements RequestHandler<CompleteGoal, Goal> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: CompleteGoal): Promise<Goal> {
    return this.gateway.completeGoal(command.goalId);
  }
}
