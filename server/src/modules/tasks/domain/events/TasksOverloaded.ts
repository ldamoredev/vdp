import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export class TasksOverloaded extends DomainEvent {
    constructor(payload: Record<string, unknown>) {
        super('tasks', 'overloaded', payload);
    }
}
