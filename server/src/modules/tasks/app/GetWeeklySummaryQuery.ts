import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { GetDayStats } from '../services/GetDayStats';
import { GetWeeklySummary, WeeklySummary } from '../services/GetWeeklySummary';

export class GetWeeklySummaryQuery extends Query<WeeklySummary> {
    constructor(readonly days?: number) {
        super();
    }
}

export class GetWeeklySummaryQueryHandler implements RequestHandler<GetWeeklySummaryQuery, WeeklySummary> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetWeeklySummaryQuery, identity: Identity): Promise<WeeklySummary> {
        const { userId } = requireUserIdentity(identity);
        return new GetWeeklySummary(this.tasks, new GetDayStats(this.tasks)).execute(userId, query.days);
    }
}
