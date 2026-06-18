import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { DayStats, GetDayStats } from '../services/GetDayStats';

export class GetTrendStatsQuery extends Query<DayStats[]> {
    constructor(readonly days?: number) {
        super();
    }
}

export class GetTrendStatsQueryHandler implements RequestHandler<GetTrendStatsQuery, DayStats[]> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetTrendStatsQuery, identity: Identity): Promise<DayStats[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetDayStats(this.tasks).executeTrend(userId, query.days);
    }
}
