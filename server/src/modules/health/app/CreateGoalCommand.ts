import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { CreateGoal } from '../services/CreateGoal';
import { GetGoalsOverview, GoalOverviewRow } from '../services/GetGoalsOverview';
import { CreateGoalData, GoalRepository } from '../domain/GoalRepository';

export class CreateGoalCommand extends Command<GoalOverviewRow> {
    constructor(readonly input: CreateGoalData) {
        super();
    }
}

export class CreateGoalCommandHandler implements RequestHandler<CreateGoalCommand, GoalOverviewRow> {
    constructor(
        private readonly goals: GoalRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: CreateGoalCommand, identity: Identity): Promise<GoalOverviewRow> {
        const { userId } = requireUserIdentity(identity);
        const goal = await new CreateGoal(this.goals).execute(userId, command.input);
        return new GetGoalsOverview(this.goals, this.eventBus).buildRow(goal);
    }
}
