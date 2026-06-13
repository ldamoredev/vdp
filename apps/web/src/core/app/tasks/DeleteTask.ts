import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class DeleteTask extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

export class DeleteTaskHandler implements RequestHandler<DeleteTask, void> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: DeleteTask): Promise<void> {
    await this.gateway.deleteTask(command.id);
  }
}
