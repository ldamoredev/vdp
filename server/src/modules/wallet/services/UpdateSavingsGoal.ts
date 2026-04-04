import { SavingsGoal, UpdateSavingsGoalData } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';

export class UpdateSavingsGoal {
    constructor(private readonly goals: SavingsGoalRepository) {}

    async execute(userId: string, id: string, data: UpdateSavingsGoalData): Promise<SavingsGoal | null> {
        return this.goals.update(userId, id, data);
    }
}
