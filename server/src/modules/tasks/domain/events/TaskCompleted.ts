import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

/**
 * Emitted when a single task is marked as done.
 */
    export class TaskCompleted extends DomainEvent {
    constructor(payload: { taskId: string; scheduledDate: string }) {
        super("tasks", "task.completed", payload);
    }
}
