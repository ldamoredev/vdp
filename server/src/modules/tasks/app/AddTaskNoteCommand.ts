import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { TaskNote, TaskNoteRepository, TaskNoteType } from '../domain/TaskNoteRepository';
import { TaskRepository } from '../domain/TaskRepository';
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
        const task = await this.tasks.getTask(userId, command.taskId);
        if (!task) {
            throw new NotFoundHttpError('Task not found');
        }

        const note = await this.notes.addNote(userId, command.taskId, command.content, command.type);
        this.embedTask.executeInBackground(userId, command.taskId);
        return note;
    }
}
