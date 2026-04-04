import { Transaction, UpdateTransactionData } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';

export class UpdateTransaction {
    constructor(private readonly transactions: TransactionRepository) {}

    async execute(userId: string, id: string, data: UpdateTransactionData): Promise<Transaction | null> {
        return this.transactions.update(userId, id, data);
    }
}
