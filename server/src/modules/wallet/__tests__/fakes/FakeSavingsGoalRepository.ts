import { randomUUID } from 'crypto';
import {
    ContributeSavingsData,
    CreateSavingsGoalData,
    SavingsGoal,
    UpdateSavingsGoalData,
} from '../../domain/SavingsGoal';
import { SavingsGoalRepository } from '../../domain/SavingsGoalRepository';

export class FakeSavingsGoalRepository extends SavingsGoalRepository {
    private store = new Map<string, SavingsGoal>();

    seed(goals: SavingsGoal[]): void {
        for (const goal of goals) {
            this.store.set(goal.id, goal);
        }
    }

    async findAll(_userId: string): Promise<SavingsGoal[]> {
        return Array.from(this.store.values());
    }

    async findById(_userId: string, id: string): Promise<SavingsGoal | null> {
        return this.store.get(id) ?? null;
    }

    async create(_userId: string, data: CreateSavingsGoalData): Promise<SavingsGoal> {
        const now = new Date();
        const goal: SavingsGoal = {
            id: randomUUID(),
            name: data.name,
            targetAmount: data.targetAmount,
            currentAmount: '0',
            currency: data.currency,
            deadline: data.deadline ?? null,
            isCompleted: false,
            createdAt: now,
            updatedAt: now,
        };
        this.store.set(goal.id, goal);
        return goal;
    }

    async update(_userId: string, id: string, data: UpdateSavingsGoalData): Promise<SavingsGoal | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        const updated: SavingsGoal = {
            ...existing,
            ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
            updatedAt: new Date(),
        };
        this.store.set(id, updated);
        return updated;
    }

    async contribute(_userId: string, id: string, data: ContributeSavingsData): Promise<SavingsGoal | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        const currentAmount = (
            parseFloat(existing.currentAmount) + parseFloat(data.amount)
        ).toFixed(2);

        const updated: SavingsGoal = {
            ...existing,
            currentAmount,
            isCompleted: parseFloat(currentAmount) >= parseFloat(existing.targetAmount),
            updatedAt: new Date(),
        };
        this.store.set(id, updated);
        return updated;
    }
}
