import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { DayStats, getTodayStats } from './task-stats';

export class GetTodayStatsQuery extends Query<DayStats> {}

export class GetTodayStatsQueryHandler implements RequestHandler<GetTodayStatsQuery, DayStats> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(_query: GetTodayStatsQuery, identity: Identity): Promise<DayStats> {
        const { userId } = requireUserIdentity(identity);
        return getTodayStats(this.tasks, userId);
    }
}
