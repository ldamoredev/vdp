import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type TasksOverloadedPayload = {
    readonly userId: string;
    readonly carryOverRate: number;
    readonly period: string;
    readonly currentLoad: number;
    readonly threshold: number;
};

export class TasksOverloaded extends DomainEvent<TasksOverloadedPayload> {
    constructor(payload: TasksOverloadedPayload) {
        super('tasks', 'overloaded', payload);
    }
}
