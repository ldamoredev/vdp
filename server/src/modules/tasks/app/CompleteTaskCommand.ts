import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { CompleteTask } from '../services/CompleteTask';

export class CompleteTaskCommand extends Command<Task | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class CompleteTaskCommandHandler implements RequestHandler<CompleteTaskCommand, Task | null> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: CompleteTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        return new CompleteTask(this.tasks, this.eventBus).execute(userId, command.id);
    }
}
