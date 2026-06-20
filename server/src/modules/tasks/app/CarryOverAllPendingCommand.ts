import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { DetectRepeatPattern } from '../services/DetectRepeatPattern';
import { carryOverTask } from './CarryOverTaskCommand';

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
        const pendingTasks = (await this.tasks.getTasksByDate(userId, command.fromDate))
            .filter((task) => task.isOpen());
        const results: Task[] = [];

        for (const task of pendingTasks) {
            const carried = await carryOverTask({
                tasks: this.tasks,
                eventBus: this.eventBus,
                detectRepeatPattern: this.detectRepeatPattern,
                userId,
                id: task.id,
                toDate: command.toDate,
            });
            if (carried) results.push(carried);
        }

        return results;
    }
}
