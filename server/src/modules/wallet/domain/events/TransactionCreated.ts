import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type TransactionCreatedPayload = {
    readonly transactionId: string;
    readonly type: string;
    readonly amount: string;
    readonly currency: string;
    readonly accountId: string;
};

export class TransactionCreated extends DomainEvent<TransactionCreatedPayload> {
    constructor(payload: TransactionCreatedPayload) {
        super('wallet', 'transaction.created', payload);
    }
}
