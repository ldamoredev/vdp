import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { TaskNote } from "../../domain/tasks/TaskNote";
import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class ListTaskNotes extends Query<TaskNote[]> {
  constructor(readonly taskId: string) {
    super();
  }
}

export class ListTaskNotesHandler implements RequestHandler<ListTaskNotes, TaskNote[]> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: ListTaskNotes): Promise<TaskNote[]> {
    return this.gateway.listNotes(query.taskId);
  }
}
