import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Task } from "../../domain/tasks/Task";
import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class CarryOverTask extends Command<Task> {
  constructor(readonly id: string, readonly toDate?: string) {
    super();
  }
}

export class CarryOverTaskHandler implements RequestHandler<CarryOverTask, Task> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: CarryOverTask): Promise<Task> {
    return this.gateway.carryOverTask(command.id, command.toDate);
  }
}
