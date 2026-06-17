import { Command, RequestHandler } from "@nbottarini/cqbus";
import type { MoodCheckIn } from "@vdp/shared";

import type { HealthGateway, SaveMoodCheckInInput } from "../../domain/health/HealthGateway";

export class SaveMoodCheckIn extends Command<MoodCheckIn> {
  constructor(readonly input: SaveMoodCheckInInput) {
    super();
  }
}

export class SaveMoodCheckInHandler implements RequestHandler<SaveMoodCheckIn, MoodCheckIn> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: SaveMoodCheckIn): Promise<MoodCheckIn> {
    return this.gateway.saveMoodCheckIn(command.input);
  }
}
