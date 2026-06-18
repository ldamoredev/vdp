import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { GetCarryOverRate } from '../services/GetCarryOverRate';
import { GetDayStats } from '../services/GetDayStats';
import { GetPlanningContext, PlanningContext } from '../services/GetPlanningContext';
import { TaskInsightsStore } from '../services/TaskInsightsStore';

export class GetPlanningContextQuery extends Query<PlanningContext> {}

export class GetPlanningContextQueryHandler implements RequestHandler<GetPlanningContextQuery, PlanningContext> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly insightsStore: TaskInsightsStore,
    ) {}

    async handle(_query: GetPlanningContextQuery, identity: Identity): Promise<PlanningContext> {
        const { userId } = requireUserIdentity(identity);
        const dayStats = new GetDayStats(this.tasks);
        const carryOverRate = new GetCarryOverRate(this.tasks);
        return new GetPlanningContext(this.tasks, dayStats, carryOverRate, this.insightsStore).execute(userId);
    }
}
