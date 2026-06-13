import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { TaskReview } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetTaskReview extends Query<TaskReview> {
  constructor(readonly date?: string) {
    super();
  }
}

export class GetTaskReviewHandler implements RequestHandler<GetTaskReview, TaskReview> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: GetTaskReview): Promise<TaskReview> {
    return this.gateway.getReview(query.date);
  }
}
