import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { DiscardTask } from '../services/DiscardTask';

export class DiscardTaskCommand extends Command<Task | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class DiscardTaskCommandHandler implements RequestHandler<DiscardTaskCommand, Task | null> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(command: DiscardTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        return new DiscardTask(this.tasks).execute(userId, command.id);
    }
}
