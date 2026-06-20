import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { DomainHttpError } from '../../common/http/errors';
import { Task } from '../domain/Task';
import { TaskCompleted } from '../domain/events/TaskCompleted';
import { TaskRepository } from '../domain/TaskRepository';

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
        const task = await this.tasks.getTask(userId, command.id);
        if (!task) return null;

        if (!task.isOpen()) {
            throw new DomainHttpError(`Cannot complete a ${task.status} task`);
        }

        task.complete();
        const saved = await this.tasks.save(userId, task);

        await this.eventBus.emit(new TaskCompleted({
            userId,
            taskId: saved.id,
            scheduledDate: saved.scheduledDate,
            title: saved.title,
            domain: saved.domain,
        }));

        return saved;
    }
}
