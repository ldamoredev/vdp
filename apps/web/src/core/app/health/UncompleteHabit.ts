import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway } from "../../domain/health/HealthGateway";

export class UncompleteHabit extends Command<void> {
  constructor(readonly habitId: string, readonly date?: string) {
    super();
  }
}

export class UncompleteHabitHandler implements RequestHandler<UncompleteHabit, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: UncompleteHabit): Promise<void> {
    await this.gateway.uncompleteHabit(command.habitId, command.date);
  }
}
