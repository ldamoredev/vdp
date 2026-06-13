import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { CreateHabitInput, HealthGateway } from "../../domain/health/HealthGateway";

export class CreateHabit extends Command<void> {
  constructor(readonly input: CreateHabitInput) {
    super();
  }
}

export class CreateHabitHandler implements RequestHandler<CreateHabit, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: CreateHabit): Promise<void> {
    await this.gateway.createHabit(command.input);
  }
}
