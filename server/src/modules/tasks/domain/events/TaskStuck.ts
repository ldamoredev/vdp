import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type TaskStuckPayload = {
    readonly userId: string;
    readonly taskId: string;
    readonly title: string;
    readonly carryOverCount: number;
};

export class TaskStuck extends DomainEvent<TaskStuckPayload> {
    constructor(payload: TaskStuckPayload) {
        super('tasks', 'task.stuck', payload);
    }
}
