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
        // Carrying over means postponing: the new date must be strictly after the
        // task's current date. This still allows pulling an overdue task forward
        // to today, but blocks same-day "carry overs" and moves into the past.
        if (targetDate <= task.scheduledDate) {
            throw new DomainHttpError(
                `Cannot carry over to ${targetDate}; the new date must be after the task's current date (${task.scheduledDate}).`,
            );
        }
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
