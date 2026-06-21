import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { RecurringTransaction } from '../domain/RecurringTransaction';
import { RecurringTransactionRepository } from '../domain/RecurringTransactionRepository';

export class GetRecurringTransactionsQuery extends Query<RecurringTransaction[]> {}

export class GetRecurringTransactionsQueryHandler
    implements RequestHandler<GetRecurringTransactionsQuery, RecurringTransaction[]>
{
    constructor(private readonly recurring: RecurringTransactionRepository) {}

    async handle(_query: GetRecurringTransactionsQuery, identity: Identity): Promise<RecurringTransaction[]> {
        const { userId } = requireUserIdentity(identity);
        return this.recurring.list(userId);
    }
}
