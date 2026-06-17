import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { GoalRepository } from '../domain/GoalRepository';
import { DropGoal } from '../services/DropGoal';
import { GetGoalsOverview, GoalOverviewRow } from '../services/GetGoalsOverview';

export class DropGoalCommand extends Command<GoalOverviewRow> {
    constructor(readonly goalId: string) {
        super();
    }
}

export class DropGoalCommandHandler implements RequestHandler<DropGoalCommand, GoalOverviewRow> {
    constructor(
        private readonly goals: GoalRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: DropGoalCommand, identity: Identity): Promise<GoalOverviewRow> {
        const { userId } = requireUserIdentity(identity);
        const goal = await new DropGoal(this.goals).execute(userId, command.goalId);
        return new GetGoalsOverview(this.goals, this.eventBus).buildRow(goal);
    }
}
