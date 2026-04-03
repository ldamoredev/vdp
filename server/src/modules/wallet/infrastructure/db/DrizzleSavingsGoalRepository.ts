import {
    ContributeSavingsData,
    CreateSavingsGoalData,
    SavingsGoal,
    UpdateSavingsGoalData,
} from '../../domain/SavingsGoal';
import { SavingsGoalRepository } from '../../domain/SavingsGoalRepository';
import { Database } from '../../../common/base/db/Database';
import { savingsContributions, savingsGoals } from '../../schema';
import { and, eq } from 'drizzle-orm';
import { getScopedUserId } from '../../../common/http/request-auth';

export class DrizzleSavingsGoalRepository extends SavingsGoalRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(): Promise<SavingsGoal[]> {
        return this.db.query
            .select()
            .from(savingsGoals)
            .where(eq(savingsGoals.ownerUserId, getScopedUserId()));
    }

    async findById(id: string): Promise<SavingsGoal | null> {
        const [row] = await this.db.query
            .select()
            .from(savingsGoals)
            .where(and(eq(savingsGoals.id, id), eq(savingsGoals.ownerUserId, getScopedUserId())));
        return row ?? null;
    }

    async create(data: CreateSavingsGoalData): Promise<SavingsGoal> {
        const [row] = await this.db.query
            .insert(savingsGoals)
            .values({
                ownerUserId: getScopedUserId(),
                name: data.name,
                targetAmount: data.targetAmount,
                currency: data.currency,
                deadline: data.deadline ?? null,
            })
            .returning();

        return row;
    }

    private static readonly UPDATABLE_FIELDS = ['name', 'targetAmount', 'currency', 'deadline'] as const;

    async update(id: string, data: UpdateSavingsGoalData): Promise<SavingsGoal | null> {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        for (const field of DrizzleSavingsGoalRepository.UPDATABLE_FIELDS) {
            if (data[field] !== undefined) updateData[field] = data[field];
        }

        const [updated] = await this.db.query
            .update(savingsGoals)
            .set(updateData)
            .where(and(eq(savingsGoals.id, id), eq(savingsGoals.ownerUserId, getScopedUserId())))
            .returning();

        return updated ?? null;
    }

    async contribute(id: string, data: ContributeSavingsData): Promise<SavingsGoal | null> {
        const existing = await this.findById(id);
        if (!existing) return null;

        const nextCurrentAmount = (
            parseFloat(existing.currentAmount) + parseFloat(data.amount)
        ).toFixed(2);
        const isCompleted = parseFloat(nextCurrentAmount) >= parseFloat(existing.targetAmount);

        await this.db.query
            .insert(savingsContributions)
            .values({
                ownerUserId: getScopedUserId(),
                goalId: id,
                transactionId: data.transactionId ?? null,
                amount: data.amount,
                date: data.date,
                note: data.note ?? null,
            });

        const [updated] = await this.db.query
            .update(savingsGoals)
            .set({
                currentAmount: nextCurrentAmount,
                isCompleted,
                updatedAt: new Date(),
            })
            .where(and(eq(savingsGoals.id, id), eq(savingsGoals.ownerUserId, getScopedUserId())))
            .returning();

        return updated ?? null;
    }
}
