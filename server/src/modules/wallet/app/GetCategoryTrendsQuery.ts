import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { CategoryTrend, GetCategoryTrends } from '../services/GetCategoryTrends';

export class GetCategoryTrendsQuery extends Query<CategoryTrend[]> {}

export class GetCategoryTrendsQueryHandler implements RequestHandler<GetCategoryTrendsQuery, CategoryTrend[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(_query: GetCategoryTrendsQuery, identity: Identity): Promise<CategoryTrend[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetCategoryTrends(this.transactions, this.categories).execute(userId);
    }
}
