export type Transaction = {
    readonly id: string;
    readonly accountId: string;
    readonly categoryId: string | null;
    readonly type: string;
    readonly amount: string;
    readonly currency: string;
    readonly description: string | null;
    readonly date: string;
    readonly transferToAccountId: string | null;
    readonly tags: string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
};

export type TransactionType = 'income' | 'expense' | 'transfer';

export type CreateTransactionData = {
    readonly accountId: string;
    readonly categoryId?: string | null;
    readonly type: TransactionType;
    readonly amount: string;
    readonly currency: string;
    readonly description?: string | null;
    readonly date: string;
    readonly transferToAccountId?: string | null;
    readonly tags?: string[];
};

export type UpdateTransactionData = Partial<CreateTransactionData>;

export type TransactionFilters = {
    readonly from?: string;
    readonly to?: string;
    readonly accountId?: string;
    readonly categoryId?: string;
    readonly type?: TransactionType;
    readonly search?: string;
    readonly limit?: number;
    readonly offset?: number;
};

export type PagedTransactions = {
    readonly transactions: Transaction[];
    readonly total: number;
    readonly limit: number;
    readonly offset: number;
};
