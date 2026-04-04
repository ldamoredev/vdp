import { SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';

export class GetSavingsGoals {
    constructor(private readonly goals: SavingsGoalRepository) {}

    async execute(userId: string): Promise<SavingsGoal[]> {
        return this.goals.findAll(userId);
    }
}
