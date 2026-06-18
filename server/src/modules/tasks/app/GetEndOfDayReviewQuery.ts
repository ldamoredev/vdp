import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { DayReview, GetEndOfDayReview } from '../services/GetEndOfDayReview';
import { RecommendationEngine } from '../services/RecommendationEngine';

export class GetEndOfDayReviewQuery extends Query<DayReview> {
    constructor(readonly date?: string) {
        super();
    }
}

export class GetEndOfDayReviewQueryHandler implements RequestHandler<GetEndOfDayReviewQuery, DayReview> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly recommendationEngine: RecommendationEngine,
    ) {}

    async handle(query: GetEndOfDayReviewQuery, identity: Identity): Promise<DayReview> {
        const { userId } = requireUserIdentity(identity);
        return new GetEndOfDayReview(this.tasks, this.recommendationEngine).execute(userId, query.date);
    }
}
