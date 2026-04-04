import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type SpendingSpikePayload = {
    readonly userId: string;
    readonly totalExpenses: string;
    readonly previousAverage: string;
    readonly percentageIncrease: number;
    readonly currency: string;
    readonly periodFrom: string;
    readonly periodTo: string;
};

export class SpendingSpike extends DomainEvent<SpendingSpikePayload> {
    constructor(payload: SpendingSpikePayload) {
        super('wallet', 'spending.spike', payload);
    }
}
