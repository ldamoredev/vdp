import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { GetSpendingStats, SpendingSummary } from '../services/GetSpendingStats';

export class GetSpendingSummaryQuery extends Query<SpendingSummary> {
    constructor(
        readonly from?: string,
        readonly to?: string,
        readonly accountId?: string,
    ) {
        super();
    }
}

export class GetSpendingSummaryQueryHandler implements RequestHandler<GetSpendingSummaryQuery, SpendingSummary> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(query: GetSpendingSummaryQuery, identity: Identity): Promise<SpendingSummary> {
        const { userId } = requireUserIdentity(identity);
        return new GetSpendingStats(this.transactions, this.categories)
            .executeSummary(userId, query.from, query.to, query.accountId);
    }
}
