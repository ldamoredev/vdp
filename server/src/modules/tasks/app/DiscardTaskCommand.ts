import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError } from '../../common/http/errors';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';

export class DiscardTaskCommand extends Command<Task | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class DiscardTaskCommandHandler implements RequestHandler<DiscardTaskCommand, Task | null> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(command: DiscardTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        const task = await this.tasks.getTask(userId, command.id);
        if (!task) return null;

        if (task.status !== 'pending') {
            throw new DomainHttpError(`Cannot discard a ${task.status} task`);
        }

        task.discard();
        return this.tasks.save(userId, task);
    }
}
