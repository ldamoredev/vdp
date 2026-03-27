import { SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';

export class GetSavingsGoals {
    constructor(private readonly goals: SavingsGoalRepository) {}

    async execute(): Promise<SavingsGoal[]> {
        return this.goals.findAll();
    }
}
