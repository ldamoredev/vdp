import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { HabitSnapshot } from '../domain/Habit';
import { HabitRepository } from '../domain/HabitRepository';
import { GoalRepository } from '../domain/GoalRepository';
import { normalizeCreateHabitData } from './CreateHabitCommand';
import { GetGoalsOverviewQueryHandler, GoalOverviewRow } from './GetGoalsOverviewQuery';

export type GraduateGoalCommandInput = {
    readonly habitName: string;
    readonly emoji?: string | null;
    readonly cadence?: 'daily' | 'weekly';
    readonly weeklyTarget?: number | null;
};

export type GraduateGoalResult = {
    readonly goal: GoalOverviewRow;
    readonly habit: HabitSnapshot;
};

export class GraduateGoalCommand extends Command<GraduateGoalResult> {
    constructor(
        readonly goalId: string,
        readonly input: GraduateGoalCommandInput,
    ) {
        super();
    }
}

export class GraduateGoalCommandHandler implements RequestHandler<GraduateGoalCommand, GraduateGoalResult> {
    constructor(
        private readonly goals: GoalRepository,
        private readonly habits: HabitRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: GraduateGoalCommand, identity: Identity): Promise<GraduateGoalResult> {
        const { userId } = requireUserIdentity(identity);
        const goal = await this.goals.getGoal(userId, command.goalId);
        if (!goal) throw new NotFoundHttpError('Goal not found');
        if (goal.status === 'dropped') throw new DomainHttpError('Goal was dropped');

        if (goal.status !== 'done') {
            goal.complete();
            await this.goals.save(userId, goal);
        }

        const habit = await this.habits.createHabit(userId, normalizeCreateHabitData({
            name: command.input.habitName,
            emoji: command.input.emoji ?? null,
            cadence: command.input.cadence,
            weeklyTarget: command.input.weeklyTarget,
        }));

        return {
            goal: new GetGoalsOverviewQueryHandler(this.goals, this.eventBus).buildRow(goal),
            habit: habit.toSnapshot(),
        };
    }
}
