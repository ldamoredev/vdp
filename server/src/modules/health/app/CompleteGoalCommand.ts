import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { GoalRepository } from '../domain/GoalRepository';
import { GetGoalsOverviewQueryHandler, GoalOverviewRow } from './GetGoalsOverviewQuery';

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
        const goal = await this.goals.getGoal(userId, command.goalId);
        if (!goal) throw new NotFoundHttpError('Goal not found');
        if (goal.status === 'dropped') throw new DomainHttpError('Goal was dropped');

        if (goal.status !== 'done') {
            goal.complete();
            await this.goals.save(userId, goal);
        }

        return new GetGoalsOverviewQueryHandler(this.goals, this.eventBus).buildRow(goal);
    }
}
