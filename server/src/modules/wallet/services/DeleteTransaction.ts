import { Transaction } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';

export class DeleteTransaction {
    constructor(private readonly transactions: TransactionRepository) {}

    async execute(id: string): Promise<Transaction | null> {
        return this.transactions.delete(id);
    }
}
