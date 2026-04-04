import {
    Transaction,
    CreateTransactionData,
    UpdateTransactionData,
    TransactionFilters,
    PagedTransactions,
} from './Transaction';

export abstract class TransactionRepository {
    abstract list(userId: string, filters: TransactionFilters): Promise<PagedTransactions>;
    abstract findById(userId: string, id: string): Promise<Transaction | null>;
    abstract create(userId: string, data: CreateTransactionData): Promise<Transaction>;
    abstract update(userId: string, id: string, data: UpdateTransactionData): Promise<Transaction | null>;
    abstract delete(userId: string, id: string): Promise<Transaction | null>;
    abstract sumByAccountId(userId: string, accountId: string): Promise<string>;
    abstract sumByDateRange(userId: string, from: string, to: string, accountId?: string): Promise<string>;
}
