import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { DailyAllCompleted } from '../domain/events/DailyAllCompleted';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';

/**
 * Event subscriber: listens for task.completed events and checks
 * if all tasks for that date are done. If so, emits DailyAllCompleted.
 */
export class CheckDailyCompletion {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    /**
     * Subscribe to the event bus. Called once during module initialization.
     */
    subscribe(): void {
        this.eventBus.on("tasks.task.completed", (event: DomainEvent) => {
            const { scheduledDate } = event.payload as { scheduledDate: string };
            this.check(scheduledDate);
        });
    }

    private async check(date: string): Promise<void> {
        const pendingCount = await this.repository.countByDateAndStatus(date, "pending");

        if (pendingCount === 0) {
            const doneCount = await this.repository.countByDateAndStatus(date, "done");
            if (doneCount > 0) {
                await this.eventBus.emit(new DailyAllCompleted({ date, count: doneCount }));
            }
        }
    }
}
