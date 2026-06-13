import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Task } from "../../domain/tasks/Task";
import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class CompleteTask extends Command<Task> {
  constructor(readonly id: string) {
    super();
  }
}

export class CompleteTaskHandler implements RequestHandler<CompleteTask, Task> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: CompleteTask): Promise<Task> {
    return this.gateway.completeTask(command.id);
  }
}
