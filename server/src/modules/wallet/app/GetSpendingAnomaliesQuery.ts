import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { GetSpendingAnomalies, SpendingAnomaly } from '../services/GetSpendingAnomalies';

export class GetSpendingAnomaliesQuery extends Query<SpendingAnomaly[]> {}

export class GetSpendingAnomaliesQueryHandler implements RequestHandler<GetSpendingAnomaliesQuery, SpendingAnomaly[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(_query: GetSpendingAnomaliesQuery, identity: Identity): Promise<SpendingAnomaly[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetSpendingAnomalies(this.transactions, this.categories).execute(userId);
    }
}
