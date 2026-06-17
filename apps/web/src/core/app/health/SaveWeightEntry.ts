import { Command, RequestHandler } from "@nbottarini/cqbus";
import type { WeightEntry } from "@vdp/shared";

import type { HealthGateway, SaveWeightEntryInput } from "../../domain/health/HealthGateway";

export class SaveWeightEntry extends Command<WeightEntry> {
  constructor(readonly input: SaveWeightEntryInput) {
    super();
  }
}

export class SaveWeightEntryHandler implements RequestHandler<SaveWeightEntry, WeightEntry> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(command: SaveWeightEntry): Promise<WeightEntry> {
    return this.gateway.saveWeightEntry(command.input);
  }
}
