import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TaskStuck } from '../domain/events/TaskStuck';
import { tomorrowISO } from '../../common/base/time/dates';
import { DomainHttpError } from '../../common/http/errors';
import { DetectRepeatPattern } from './DetectRepeatPattern';

export class CarryOverTask {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
        private detectRepeatPattern: DetectRepeatPattern,
    ) {}

    async execute(userId: string, id: string, toDate?: string): Promise<Task | null> {
        const task = await this.repository.getTask(userId, id);
        if (!task) return null;

        if (task.status !== 'pending') {
            throw new DomainHttpError(`Cannot carry over a ${task.status} task`);
        }

        const targetDate = toDate || this.tomorrow();
        task.carryOver(targetDate);

        const saved = await this.repository.save(userId, task);

        if (saved.isStuck()) {
            await this.eventBus.emit(new TaskStuck({
                userId,
                taskId: saved.id,
                title: saved.title,
                carryOverCount: saved.carryOverCount,
            }));
        }

        await this.detectRepeatPattern.execute(userId, saved);

        return saved;
    }

    private tomorrow(): string {
        return tomorrowISO();
    }
}
