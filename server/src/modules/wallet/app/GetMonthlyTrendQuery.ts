import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { GetSpendingStats, MonthlyTrendPoint } from '../services/GetSpendingStats';

export class GetMonthlyTrendQuery extends Query<MonthlyTrendPoint[]> {
    constructor(readonly year?: number) {
        super();
    }
}

export class GetMonthlyTrendQueryHandler implements RequestHandler<GetMonthlyTrendQuery, MonthlyTrendPoint[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(query: GetMonthlyTrendQuery, identity: Identity): Promise<MonthlyTrendPoint[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetSpendingStats(this.transactions, this.categories)
            .executeMonthlyTrend(userId, query.year);
    }
}
