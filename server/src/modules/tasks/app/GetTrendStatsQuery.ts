import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { DayStats, getTrendStats } from './task-stats';

export class GetTrendStatsQuery extends Query<DayStats[]> {
    constructor(readonly days?: number) {
        super();
    }
}

export class GetTrendStatsQueryHandler implements RequestHandler<GetTrendStatsQuery, DayStats[]> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetTrendStatsQuery, identity: Identity): Promise<DayStats[]> {
        const { userId } = requireUserIdentity(identity);
        return getTrendStats(this.tasks, userId, query.days);
    }
}
