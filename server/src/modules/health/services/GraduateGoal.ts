import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { Goal } from '../domain/Goal';
import { Habit } from '../domain/Habit';
import { GoalRepository } from '../domain/GoalRepository';
import { CreateHabit } from './CreateHabit';

/**
 * The graduation loop: a goal is how a habit gets started; a habit is how
 * a goal stays won. Completes the goal (idempotently — it may already be
 * done when the UI offers the conversion) and creates the habit with the
 * chosen cadence.
 */
export class GraduateGoal {
    constructor(
        private readonly goals: GoalRepository,
        private readonly createHabit: CreateHabit,
    ) {}

    async execute(userId: string, goalId: string, data: {
        habitName: string;
        emoji?: string | null;
        cadence?: 'daily' | 'weekly';
        weeklyTarget?: number | null;
    }): Promise<{ goal: Goal; habit: Habit }> {
        const goal = await this.goals.getGoal(userId, goalId);
        if (!goal) throw new NotFoundHttpError('Goal not found');
        if (goal.status === 'dropped') throw new DomainHttpError('Goal was dropped');

        if (goal.status !== 'done') {
            goal.complete();
            await this.goals.save(userId, goal);
        }

        const habit = await this.createHabit.execute(userId, {
            name: data.habitName,
            emoji: data.emoji ?? null,
            cadence: data.cadence,
            weeklyTarget: data.weeklyTarget,
        });

        return { goal, habit };
    }
}
