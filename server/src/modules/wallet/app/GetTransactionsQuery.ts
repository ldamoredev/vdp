import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { PagedTransactions, TransactionFilters } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';
import { GetTransactions } from '../services/GetTransactions';

export class GetTransactionsQuery extends Query<PagedTransactions> {
    constructor(readonly filters: TransactionFilters) {
        super();
    }
}

export class GetTransactionsQueryHandler implements RequestHandler<GetTransactionsQuery, PagedTransactions> {
    constructor(private readonly transactions: TransactionRepository) {}

    async handle(query: GetTransactionsQuery, identity: Identity): Promise<PagedTransactions> {
        const { userId } = requireUserIdentity(identity);
        return new GetTransactions(this.transactions).execute(userId, query.filters);
    }
}
