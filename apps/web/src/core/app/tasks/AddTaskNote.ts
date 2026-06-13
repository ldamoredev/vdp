import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { TaskNote, TaskNoteType } from "../../domain/tasks/TaskNote";
import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class AddTaskNote extends Command<TaskNote> {
  constructor(
    readonly taskId: string,
    readonly content: string,
    readonly type: TaskNoteType = "note",
  ) {
    super();
  }
}

export class AddTaskNoteHandler implements RequestHandler<AddTaskNote, TaskNote> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: AddTaskNote): Promise<TaskNote> {
    return this.gateway.addNote(command.taskId, command.content, command.type);
  }
}
