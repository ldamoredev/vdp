import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Task } from "../../domain/tasks/Task";
import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class DiscardTask extends Command<Task> {
  constructor(readonly id: string) {
    super();
  }
}

export class DiscardTaskHandler implements RequestHandler<DiscardTask, Task> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: DiscardTask): Promise<Task> {
    return this.gateway.discardTask(command.id);
  }
}
