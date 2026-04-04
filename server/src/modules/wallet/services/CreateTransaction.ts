import { Transaction, CreateTransactionData } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TransactionCreated } from '../domain/events/TransactionCreated';

export class CreateTransaction {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(userId: string, data: CreateTransactionData): Promise<Transaction> {
        const tx = await this.transactions.create(userId, data);
        await this.eventBus.emit(
            new TransactionCreated({
                userId,
                transactionId: tx.id,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                accountId: tx.accountId,
            }),
        );
        return tx;
    }
}
