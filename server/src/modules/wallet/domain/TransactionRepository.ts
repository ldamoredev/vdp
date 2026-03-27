import {
    Transaction,
    CreateTransactionData,
    UpdateTransactionData,
    TransactionFilters,
    PagedTransactions,
} from './Transaction';

export abstract class TransactionRepository {
    abstract list(filters: TransactionFilters): Promise<PagedTransactions>;
    abstract findById(id: string): Promise<Transaction | null>;
    abstract create(data: CreateTransactionData): Promise<Transaction>;
    abstract update(id: string, data: UpdateTransactionData): Promise<Transaction | null>;
    abstract delete(id: string): Promise<Transaction | null>;
    abstract sumByAccountId(accountId: string): Promise<string>;
    abstract sumByDateRange(from: string, to: string, accountId?: string): Promise<string>;
}
