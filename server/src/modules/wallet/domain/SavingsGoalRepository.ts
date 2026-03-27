import {
    ContributeSavingsData,
    CreateSavingsGoalData,
    SavingsGoal,
    UpdateSavingsGoalData,
} from './SavingsGoal';

export abstract class SavingsGoalRepository {
    abstract findAll(): Promise<SavingsGoal[]>;
    abstract findById(id: string): Promise<SavingsGoal | null>;
    abstract create(data: CreateSavingsGoalData): Promise<SavingsGoal>;
    abstract update(id: string, data: UpdateSavingsGoalData): Promise<SavingsGoal | null>;
    abstract contribute(id: string, data: ContributeSavingsData): Promise<SavingsGoal | null>;
}
