import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export class TaskStuck extends DomainEvent {
    constructor(payload: Record<string, unknown>) {
        super('tasks', 'task.stuck', payload);
    }
}
