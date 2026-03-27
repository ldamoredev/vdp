import { SavingsGoal, UpdateSavingsGoalData } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';

export class UpdateSavingsGoal {
    constructor(private readonly goals: SavingsGoalRepository) {}

    async execute(id: string, data: UpdateSavingsGoalData): Promise<SavingsGoal | null> {
        return this.goals.update(id, data);
    }
}
