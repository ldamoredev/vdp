import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { GoalRepository } from '../domain/GoalRepository';
import { CompleteGoal } from '../services/CompleteGoal';
import { GetGoalsOverview, GoalOverviewRow } from '../services/GetGoalsOverview';

export class CompleteGoalCommand extends Command<GoalOverviewRow> {
    constructor(readonly goalId: string) {
        super();
    }
}

export class CompleteGoalCommandHandler implements RequestHandler<CompleteGoalCommand, GoalOverviewRow> {
    constructor(
        private readonly goals: GoalRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: CompleteGoalCommand, identity: Identity): Promise<GoalOverviewRow> {
        const { userId } = requireUserIdentity(identity);
        const goal = await new CompleteGoal(this.goals).execute(userId, command.goalId);
        return new GetGoalsOverview(this.goals, this.eventBus).buildRow(goal);
    }
}
