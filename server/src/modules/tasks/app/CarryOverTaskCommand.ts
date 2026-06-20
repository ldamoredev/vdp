import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { tomorrowISO } from '../../common/base/time/dates';
import { DomainHttpError } from '../../common/http/errors';
import { Task } from '../domain/Task';
import { TaskStuck } from '../domain/events/TaskStuck';
import { TaskRepository } from '../domain/TaskRepository';
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
        return carryOverTask({
            tasks: this.tasks,
            eventBus: this.eventBus,
            detectRepeatPattern: this.detectRepeatPattern,
            userId,
            id: command.id,
            toDate: command.toDate,
        });
    }
}

export async function carryOverTask(input: {
    tasks: TaskRepository;
    eventBus: EventBus;
    detectRepeatPattern: DetectRepeatPattern;
    userId: string;
    id: string;
    toDate?: string;
}): Promise<Task | null> {
    const task = await input.tasks.getTask(input.userId, input.id);
    if (!task) return null;

    if (!task.isOpen()) {
        throw new DomainHttpError(`Cannot carry over a ${task.status} task`);
    }

    const targetDate = input.toDate || tomorrowISO();
    if (targetDate <= task.scheduledDate) {
        throw new DomainHttpError(
            `Cannot carry over to ${targetDate}; the new date must be after the task's current date (${task.scheduledDate}).`,
        );
    }

    task.carryOver(targetDate);
    const saved = await input.tasks.save(input.userId, task);

    if (saved.isStuck()) {
        await input.eventBus.emit(new TaskStuck({
            userId: input.userId,
            taskId: saved.id,
            title: saved.title,
            carryOverCount: saved.carryOverCount,
        }));
    }

    await input.detectRepeatPattern.execute(input.userId, saved);

    return saved;
}
