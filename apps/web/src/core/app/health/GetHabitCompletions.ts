import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { HabitCompletionsResponse } from "@vdp/shared";

import type { GetHabitCompletionsInput, HealthGateway } from "../../domain/health/HealthGateway";

export class GetHabitCompletions extends Query<HabitCompletionsResponse> {
  constructor(readonly input: GetHabitCompletionsInput) {
    super();
  }
}

export class GetHabitCompletionsHandler implements RequestHandler<GetHabitCompletions, HabitCompletionsResponse> {
  constructor(private readonly gateway: HealthGateway) {}

  async handle(query: GetHabitCompletions): Promise<HabitCompletionsResponse> {
    return this.gateway.getHabitCompletions(query.input);
  }
}
