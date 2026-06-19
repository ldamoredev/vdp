import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Task } from '../domain/Task';
import { TaskNoteRepository } from '../domain/TaskNoteRepository';
import { TaskRepository } from '../domain/TaskRepository';

export class DeleteTaskCommand extends Command<Task | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class DeleteTaskCommandHandler implements RequestHandler<DeleteTaskCommand, Task | null> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly notes: TaskNoteRepository,
    ) {}

    async handle(command: DeleteTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        await this.notes.deleteByTaskId(userId, command.id);
        return this.tasks.deleteTask(userId, command.id);
    }
}
