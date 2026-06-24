import { Command, RequestHandler } from "@nbottarini/cqbus";
import type { DailyReviewState } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class SaveDailyReviewState extends Command<DailyReviewState> {
  constructor(readonly state: DailyReviewState) {
    super();
  }
}

export class SaveDailyReviewStateHandler
  implements RequestHandler<SaveDailyReviewState, DailyReviewState>
{
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: SaveDailyReviewState): Promise<DailyReviewState> {
    return this.gateway.saveReviewState(command.state);
  }
}
