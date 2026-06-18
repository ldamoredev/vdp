import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { GoalRepository } from '../domain/GoalRepository';
import { GetGoalsOverviewQueryHandler, GoalOverviewRow } from './GetGoalsOverviewQuery';

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
        const goal = await this.goals.getGoal(userId, command.goalId);
        if (!goal) throw new NotFoundHttpError('Goal not found');
        if (goal.status === 'done') throw new DomainHttpError('Goal is already done');

        if (goal.status !== 'dropped') {
            goal.drop();
            await this.goals.save(userId, goal);
        }

        return new GetGoalsOverviewQueryHandler(this.goals, this.eventBus).buildRow(goal);
    }
}
