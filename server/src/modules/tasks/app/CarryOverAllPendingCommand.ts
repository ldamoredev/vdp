import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { CarryOverAllPending } from '../services/CarryOverAllPending';
import { CarryOverTask } from '../services/CarryOverTask';
import { DetectRepeatPattern } from '../services/DetectRepeatPattern';

export class CarryOverAllPendingCommand extends Command<Task[]> {
    constructor(
        readonly fromDate: string,
        readonly toDate?: string,
    ) {
        super();
    }
}

export class CarryOverAllPendingCommandHandler implements RequestHandler<CarryOverAllPendingCommand, Task[]> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly eventBus: EventBus,
        private readonly detectRepeatPattern: DetectRepeatPattern,
    ) {}

    async handle(command: CarryOverAllPendingCommand, identity: Identity): Promise<Task[]> {
        const { userId } = requireUserIdentity(identity);
        const carryOverTask = new CarryOverTask(this.tasks, this.eventBus, this.detectRepeatPattern);
        return new CarryOverAllPending(this.tasks, carryOverTask)
            .execute(userId, command.fromDate, command.toDate);
    }
}
