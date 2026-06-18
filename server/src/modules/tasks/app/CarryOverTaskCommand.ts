import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { CarryOverTask } from '../services/CarryOverTask';
import { DetectRepeatPattern } from '../services/DetectRepeatPattern';

export class CarryOverTaskCommand extends Command<Task | null> {
    constructor(
        readonly id: string,
        readonly toDate?: string,
    ) {
        super();
    }
}

export class CarryOverTaskCommandHandler implements RequestHandler<CarryOverTaskCommand, Task | null> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly eventBus: EventBus,
        private readonly detectRepeatPattern: DetectRepeatPattern,
    ) {}

    async handle(command: CarryOverTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        return new CarryOverTask(this.tasks, this.eventBus, this.detectRepeatPattern)
            .execute(userId, command.id, command.toDate);
    }
}
