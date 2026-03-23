import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type RepeatPatternType = 'habitual_discard' | 'frequent_recreation' | 'stuck_pattern';

export class TaskRepeatDetected extends DomainEvent {
    constructor(payload: {
        taskId: string;
        title: string;
        pattern: RepeatPatternType;
        previousInstances: number;
    }) {
        super('tasks', 'task.repeat_detected', payload);
    }
}
