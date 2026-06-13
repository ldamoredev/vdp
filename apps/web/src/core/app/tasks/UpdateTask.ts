import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Task } from "../../domain/tasks/Task";
import type { TasksGateway, UpdateTaskInput } from "../../domain/tasks/TasksGateway";

export class UpdateTask extends Command<Task> {
  constructor(readonly id: string, readonly input: UpdateTaskInput) {
    super();
  }
}

export class UpdateTaskHandler implements RequestHandler<UpdateTask, Task> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: UpdateTask): Promise<Task> {
    return this.gateway.updateTask(command.id, command.input);
  }
}
