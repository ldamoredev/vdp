import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { HealthGateway } from "../../domain/health/HealthGateway";

export class ArchiveHabit extends Command<void> {
  constructor(readonly habitId: string) {
    super();
  }
}

export class ArchiveHabitHandler implements RequestHandler<ArchiveHabit, void> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: ArchiveHabit): Promise<void> {
    await this.gateway.archiveHabit(command.habitId);
  }
}
