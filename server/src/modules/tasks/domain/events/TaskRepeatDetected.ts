import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type RepeatPatternType = 'habitual_discard' | 'frequent_recreation' | 'stuck_pattern';

export type TaskRepeatDetectedPayload = {
    readonly userId: string;
    readonly taskId: string;
    readonly title: string;
    readonly pattern: RepeatPatternType;
    readonly previousInstances: number;
};

export class TaskRepeatDetected extends DomainEvent<TaskRepeatDetectedPayload> {
    constructor(payload: TaskRepeatDetectedPayload) {
        super('tasks', 'task.repeat_detected', payload);
    }
}
