import {
    ContributeSavingsData,
    CreateSavingsGoalData,
    SavingsGoal,
    UpdateSavingsGoalData,
} from './SavingsGoal';

export abstract class SavingsGoalRepository {
    abstract findAll(userId: string): Promise<SavingsGoal[]>;
    abstract findById(userId: string, id: string): Promise<SavingsGoal | null>;
    abstract create(userId: string, data: CreateSavingsGoalData): Promise<SavingsGoal>;
    abstract update(userId: string, id: string, data: UpdateSavingsGoalData): Promise<SavingsGoal | null>;
    abstract contribute(userId: string, id: string, data: ContributeSavingsData): Promise<SavingsGoal | null>;
}
