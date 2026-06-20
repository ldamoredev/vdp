import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Task } from "../../domain/tasks/Task";
import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class StartTask extends Command<Task> {
  constructor(readonly id: string) {
    super();
  }
}

export class StartTaskHandler implements RequestHandler<StartTask, Task> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: StartTask): Promise<Task> {
    return this.gateway.startTask(command.id);
  }
}
