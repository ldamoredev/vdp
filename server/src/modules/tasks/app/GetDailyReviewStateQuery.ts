import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DailyReviewStateRecord, DailyReviewStateRepository } from '../domain/DailyReviewStateRepository';

export class GetDailyReviewStateQuery extends Query<DailyReviewStateRecord | null> {
    constructor(readonly date: string) {
        super();
    }
}

export class GetDailyReviewStateQueryHandler
    implements RequestHandler<GetDailyReviewStateQuery, DailyReviewStateRecord | null>
{
    constructor(private readonly repository: DailyReviewStateRepository) {}

    async handle(query: GetDailyReviewStateQuery, identity: Identity): Promise<DailyReviewStateRecord | null> {
        const { userId } = requireUserIdentity(identity);
        return this.repository.get(userId, query.date);
    }
}
