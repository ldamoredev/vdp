import { CreateSavingsGoalData, SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';

export class CreateSavingsGoal {
    constructor(private readonly goals: SavingsGoalRepository) {}

    async execute(userId: string, data: CreateSavingsGoalData): Promise<SavingsGoal> {
        return this.goals.create(userId, data);
    }
}
