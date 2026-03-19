import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

/**
 * Emitted when all tasks for a given date are completed (none pending).
 */
export class DailyAllCompleted extends DomainEvent {
    constructor(payload: { date: string; count: number }) {
        super("tasks", "daily.all_completed", payload);
    }
}
