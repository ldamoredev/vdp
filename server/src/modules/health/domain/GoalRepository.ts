import { Goal } from './Goal';

export type CreateGoalData = {
    readonly title: string;
    readonly notes?: string | null;
    readonly targetDate: string;
    readonly targetWeightKg?: string | null;
};

export abstract class GoalRepository {
    abstract createGoal(userId: string, data: CreateGoalData): Promise<Goal>;
    abstract getGoal(userId: string, id: string): Promise<Goal | null>;
    /** Every goal for the user, newest first. Filtering happens in app query handlers/selectors. */
    abstract listGoals(userId: string): Promise<Goal[]>;
    abstract save(userId: string, goal: Goal): Promise<Goal>;
}
