import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type CounterMilestonePayload = {
    readonly userId: string;
    readonly counterId: string;
    readonly counterName: string;
    /** The milestone crossed, in days (1/7/30/100/365). */
    readonly days: number;
    /** Days of the current attempt when the milestone was detected. */
    readonly currentDays: number;
    /** Estimated money not spent so far (ARS), when a daily cost is set. */
    readonly moneyNotSpent: string | null;
};

export class CounterMilestone extends DomainEvent<CounterMilestonePayload> {
    constructor(payload: CounterMilestonePayload) {
        super('health', 'counter.milestone', payload);
    }
}
