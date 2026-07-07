import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import type { ObjectiveMetricSource } from '../Objective';

export type ObjectiveDeadlineApproachingPayload = {
    readonly userId: string;
    readonly objectiveId: string;
    readonly title: string;
    readonly periodEnd: string;
    /** Days until the period end; 0 = today, negative = overdue. */
    readonly daysLeft: number;
    /** Current progress value when the source is manual; null for cross-module sources. */
    readonly progress: number | null;
    readonly target: number;
    readonly unit: string;
    readonly metricSource: ObjectiveMetricSource;
};

export class ObjectiveDeadlineApproaching extends DomainEvent<ObjectiveDeadlineApproachingPayload> {
    constructor(payload: ObjectiveDeadlineApproachingPayload) {
        super('objectives', 'objective.deadline_approaching', payload);
    }
}
