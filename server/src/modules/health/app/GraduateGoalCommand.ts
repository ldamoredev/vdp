import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { HabitSnapshot } from '../domain/Habit';
import { HabitRepository } from '../domain/HabitRepository';
import { GoalRepository } from '../domain/GoalRepository';
import { CreateHabit } from '../services/CreateHabit';
import { GetGoalsOverview, GoalOverviewRow } from '../services/GetGoalsOverview';
import { GraduateGoal } from '../services/GraduateGoal';

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
        const result = await new GraduateGoal(this.goals, new CreateHabit(this.habits))
            .execute(userId, command.goalId, command.input);
        return {
            goal: new GetGoalsOverview(this.goals, this.eventBus).buildRow(result.goal),
            habit: result.habit.toSnapshot(),
        };
    }
}
