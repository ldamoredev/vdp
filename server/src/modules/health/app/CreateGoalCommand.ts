import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { DomainHttpError } from '../../common/http/errors';
import { CreateGoalData, GoalRepository } from '../domain/GoalRepository';
import { GetGoalsOverviewQueryHandler, GoalOverviewRow } from './GetGoalsOverviewQuery';

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
        if (diffLocalDateISODays(todayISO(), command.input.targetDate) < 1) {
            throw new DomainHttpError('Goal target date must be in the future');
        }

        const goal = await this.goals.createGoal(userId, {
            title: command.input.title,
            notes: command.input.notes ?? null,
            targetDate: command.input.targetDate,
            targetWeightKg: command.input.targetWeightKg ?? null,
        });
        return new GetGoalsOverviewQueryHandler(this.goals, this.eventBus).buildRow(goal);
    }
}
