import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway } from "../../domain/health/HealthGateway";

export class CompleteHabit extends Command<void> {
  constructor(readonly habitId: string, readonly date?: string) {
    super();
  }
}

export class CompleteHabitHandler implements RequestHandler<CompleteHabit, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: CompleteHabit): Promise<void> {
    await this.gateway.completeHabit(command.habitId, command.date);
  }
}
