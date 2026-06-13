import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Task } from "../../domain/tasks/Task";
import type { CreateTaskInput, TasksGateway } from "../../domain/tasks/TasksGateway";

export class CreateTask extends Command<Task> {
  constructor(readonly input: CreateTaskInput) {
    super();
  }
}

export class CreateTaskHandler implements RequestHandler<CreateTask, Task> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: CreateTask): Promise<Task> {
    return this.gateway.createTask(command.input);
  }
}
