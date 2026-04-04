import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { DailyAllCompleted } from '../domain/events/DailyAllCompleted';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { TaskCompletedPayload } from '../domain/events/TaskCompleted';

/**
 * Event subscriber: listens for task.completed events and checks
 * if all tasks for that date are done. If so, emits DailyAllCompleted.
 */
export class CheckDailyCompletion implements EventSubscriber {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    /**
     * Subscribe to the event bus. Called once during module initialization.
     */
    subscribe(): void {
        this.eventBus.on('tasks.task.completed', (event: DomainEvent) => {
            const { userId, scheduledDate } = event.payload as TaskCompletedPayload;
            this.check(userId, scheduledDate);
        });
    }

    private async check(userId: string, date: string): Promise<void> {
        const counts = await this.repository.countByDate(userId, date);

        if (counts.pending === 0 && counts.done > 0) {
            await this.eventBus.emit(new DailyAllCompleted({ userId, date, count: counts.done }));
        }
    }
}
