import { Command, RequestHandler } from "@nbottarini/cqbus";
import type { DailyReviewBriefSurface, DailyReviewState } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class MarkDailyReviewBriefRequested extends Command<DailyReviewState> {
  constructor(
    readonly date: string,
    readonly surface: DailyReviewBriefSurface,
  ) {
    super();
  }
}

export class MarkDailyReviewBriefRequestedHandler
  implements RequestHandler<MarkDailyReviewBriefRequested, DailyReviewState>
{
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: MarkDailyReviewBriefRequested): Promise<DailyReviewState> {
    return this.gateway.markBriefRequested(command.date, command.surface);
  }
}
