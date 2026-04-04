import { TransactionFilters, PagedTransactions } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';

export class GetTransactions {
    constructor(private readonly transactions: TransactionRepository) {}

    async execute(userId: string, filters: TransactionFilters): Promise<PagedTransactions> {
        return this.transactions.list(userId, filters);
    }
}
