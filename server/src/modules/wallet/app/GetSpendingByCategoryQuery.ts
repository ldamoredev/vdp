import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { CategoryStat, GetSpendingStats } from '../services/GetSpendingStats';

export class GetSpendingByCategoryQuery extends Query<CategoryStat[]> {
    constructor(
        readonly from?: string,
        readonly to?: string,
    ) {
        super();
    }
}

export class GetSpendingByCategoryQueryHandler implements RequestHandler<GetSpendingByCategoryQuery, CategoryStat[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(query: GetSpendingByCategoryQuery, identity: Identity): Promise<CategoryStat[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetSpendingStats(this.transactions, this.categories)
            .executeByCategory(userId, query.from, query.to);
    }
}
