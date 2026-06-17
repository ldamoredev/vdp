import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { GoalRepository } from '../domain/GoalRepository';
import { GetGoalsOverview, GoalsOverview } from '../services/GetGoalsOverview';

export class GetGoalsOverviewQuery extends Query<GoalsOverview> {}

export class GetGoalsOverviewQueryHandler implements RequestHandler<GetGoalsOverviewQuery, GoalsOverview> {
    constructor(
        private readonly goals: GoalRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(_query: GetGoalsOverviewQuery, identity: Identity): Promise<GoalsOverview> {
        const { userId } = requireUserIdentity(identity);
        return new GetGoalsOverview(this.goals, this.eventBus).execute(userId);
    }
}
