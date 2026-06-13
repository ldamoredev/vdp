import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { TaskDetails, TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetTask extends Query<TaskDetails> {
  constructor(readonly id: string) {
    super();
  }
}

export class GetTaskHandler implements RequestHandler<GetTask, TaskDetails> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: GetTask): Promise<TaskDetails> {
    return this.gateway.getTask(query.id);
  }
}
