import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError } from '../../common/http/errors';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';

export class StartTaskCommand extends Command<Task | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class StartTaskCommandHandler implements RequestHandler<StartTaskCommand, Task | null> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(command: StartTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        const task = await this.tasks.getTask(userId, command.id);
        if (!task) return null;

        if (!task.isOpen()) {
            throw new DomainHttpError(`Cannot start a ${task.status} task`);
        }

        task.start();
        return this.tasks.save(userId, task);
    }
}
