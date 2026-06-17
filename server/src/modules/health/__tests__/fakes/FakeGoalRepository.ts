import { randomUUID } from 'crypto';
import { Goal } from '../../domain/Goal';
import { CreateGoalData, GoalRepository } from '../../domain/GoalRepository';

type StoredGoal = {
    goal: Goal;
    userId: string;
};

export class FakeGoalRepository extends GoalRepository {
    private goals = new Map<string, StoredGoal>();

    seedGoal(userId: string, goal: Goal): void {
        this.goals.set(goal.id, { goal, userId });
    }

    async createGoal(userId: string, data: CreateGoalData): Promise<Goal> {
        const goal = new Goal(
            randomUUID(),
            data.title,
            data.notes ?? null,
            data.targetDate,
            data.targetWeightKg ?? null,
            'active',
            'none',
            null,
            new Date(),
            new Date(),
        );
        this.goals.set(goal.id, { goal, userId });
        return goal;
    }

    async getGoal(userId: string, id: string): Promise<Goal | null> {
        const stored = this.goals.get(id);
        return stored && stored.userId === userId ? stored.goal : null;
    }

    async listGoals(userId: string): Promise<Goal[]> {
        return Array.from(this.goals.values())
            .filter((stored) => stored.userId === userId)
            .map((stored) => stored.goal);
    }

    async save(userId: string, goal: Goal): Promise<Goal> {
        this.goals.set(goal.id, { goal, userId });
        return goal;
    }
}
