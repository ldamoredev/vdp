import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskNote, TaskNoteRepository, TaskNoteType } from '../domain/TaskNoteRepository';
import { TaskRepository } from '../domain/TaskRepository';
import { AddTaskNote } from '../services/AddTaskNote';
import { EmbedTask } from '../services/EmbedTask';

export class AddTaskNoteCommand extends Command<TaskNote> {
    constructor(
        readonly taskId: string,
        readonly content: string,
        readonly type: TaskNoteType = 'note',
    ) {
        super();
    }
}

export class AddTaskNoteCommandHandler implements RequestHandler<AddTaskNoteCommand, TaskNote> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly notes: TaskNoteRepository,
        private readonly embedTask: EmbedTask,
    ) {}

    async handle(command: AddTaskNoteCommand, identity: Identity): Promise<TaskNote> {
        const { userId } = requireUserIdentity(identity);
        return new AddTaskNote(this.tasks, this.notes, this.embedTask)
            .execute(userId, command.taskId, command.content, command.type);
    }
}
