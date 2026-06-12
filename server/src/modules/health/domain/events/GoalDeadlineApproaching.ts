import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type GoalDeadlineApproachingPayload = {
    readonly userId: string;
    readonly goalId: string;
    readonly title: string;
    readonly targetDate: string;
    /** Days until the target date; 0 = today, negative = overdue. */
    readonly daysLeft: number;
};

export class GoalDeadlineApproaching extends DomainEvent<GoalDeadlineApproachingPayload> {
    constructor(payload: GoalDeadlineApproachingPayload) {
        super('health', 'goal.deadline_approaching', payload);
    }
}
