import { randomUUID } from 'crypto';

import { RecurringTransaction } from '../../domain/RecurringTransaction';
import { CreateRecurringTransactionData, RecurringTransactionRepository } from '../../domain/RecurringTransactionRepository';

export class FakeRecurringTransactionRepository extends RecurringTransactionRepository {
    private store = new Map<string, RecurringTransaction>();

    seed(rules: RecurringTransaction[]): void {
        for (const rule of rules) this.store.set(rule.id, rule);
    }

    async list(_userId: string): Promise<RecurringTransaction[]> {
        return Array.from(this.store.values());
    }

    async findById(_userId: string, id: string): Promise<RecurringTransaction | null> {
        return this.store.get(id) ?? null;
    }

    async create(_userId: string, data: CreateRecurringTransactionData): Promise<RecurringTransaction> {
        const now = new Date();
        const rule = new RecurringTransaction(
            randomUUID(),
            data.accountId,
            data.categoryId ?? null,
            data.type,
            data.amount,
            data.currency,
            data.description ?? null,
            data.dayOfMonth,
            data.startDate,
            data.endDate ?? null,
            null,
            true,
            now,
            now,
        );
        this.store.set(rule.id, rule);
        return rule;
    }

    async advanceLastRunIfBefore(_userId: string, id: string, date: string): Promise<boolean> {
        const rule = this.store.get(id);
        if (!rule) return false;
        if (rule.lastRunDate !== null && rule.lastRunDate >= date) return false;
        rule.lastRunDate = date;
        rule.updatedAt = new Date();
        return true;
    }

    async delete(_userId: string, id: string): Promise<RecurringTransaction | null> {
        const existing = this.store.get(id) ?? null;
        if (existing) this.store.delete(id);
        return existing;
    }
}
