import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type TaskCompletedPayload = {
    readonly userId: string;
    readonly taskId: string;
    readonly scheduledDate: string;
    readonly title: string;
    readonly domain: string | null;
};

/**
 * Emitted when a single task is marked as done.
 */
export class TaskCompleted extends DomainEvent<TaskCompletedPayload> {
    constructor(payload: TaskCompletedPayload) {
        super('tasks', 'task.completed', payload);
    }
}
