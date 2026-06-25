import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { TaskList, TaskListParams, TasksGateway } from "../../domain/tasks/TasksGateway";

export class ListTasks extends Query<TaskList> {
  constructor(readonly params?: TaskListParams) {
    super();
  }
}

export class ListTasksHandler implements RequestHandler<ListTasks, TaskList> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: ListTasks): Promise<TaskList> {
    return this.gateway.listTasks(query.params);
  }
}
