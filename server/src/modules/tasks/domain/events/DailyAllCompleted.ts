import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type DailyAllCompletedPayload = {
    readonly userId: string;
    readonly date: string;
    readonly count: number;
};

/**
 * Emitted when all tasks for a given date are completed (none pending).
 */
export class DailyAllCompleted extends DomainEvent<DailyAllCompletedPayload> {
    constructor(payload: DailyAllCompletedPayload) {
        super('tasks', 'daily.all_completed', payload);
    }
}
