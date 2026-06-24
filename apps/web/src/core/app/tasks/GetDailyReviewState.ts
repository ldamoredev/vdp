import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { DailyReviewState } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetDailyReviewState extends Query<DailyReviewState | null> {
  constructor(readonly date: string) {
    super();
  }
}

export class GetDailyReviewStateHandler
  implements RequestHandler<GetDailyReviewState, DailyReviewState | null>
{
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: GetDailyReviewState): Promise<DailyReviewState | null> {
    return this.gateway.getReviewState(query.date);
  }
}
