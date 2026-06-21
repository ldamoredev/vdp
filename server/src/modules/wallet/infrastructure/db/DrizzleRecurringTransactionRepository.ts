import { and, eq, isNull, lt, or } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { RecurringTransaction, RecurringType } from '../../domain/RecurringTransaction';
import {
    CreateRecurringTransactionData,
    RecurringTransactionRepository,
} from '../../domain/RecurringTransactionRepository';
import { recurringTransactions } from './schema';

type RecurringRow = typeof recurringTransactions.$inferSelect;

function toDomain(row: RecurringRow): RecurringTransaction {
    return RecurringTransaction.fromSnapshot({
        id: row.id,
        accountId: row.accountId,
        categoryId: row.categoryId,
        type: row.type as RecurringType,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        dayOfMonth: row.dayOfMonth,
        startDate: row.startDate,
        endDate: row.endDate,
        lastRunDate: row.lastRunDate,
        active: row.active,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    });
}

export class DrizzleRecurringTransactionRepository extends RecurringTransactionRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async list(userId: string): Promise<RecurringTransaction[]> {
        const rows = await this.db.query
            .select()
            .from(recurringTransactions)
            .where(eq(recurringTransactions.ownerUserId, userId));
        return rows.map(toDomain);
    }

    async findById(userId: string, id: string): Promise<RecurringTransaction | null> {
        const [row] = await this.db.query
            .select()
            .from(recurringTransactions)
            .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.ownerUserId, userId)));
        return row ? toDomain(row) : null;
    }

    async create(userId: string, data: CreateRecurringTransactionData): Promise<RecurringTransaction> {
        const [row] = await this.db.query
            .insert(recurringTransactions)
            .values({
                ownerUserId: userId,
                accountId: data.accountId,
                categoryId: data.categoryId ?? null,
                type: data.type,
                amount: data.amount,
                currency: data.currency,
                description: data.description ?? null,
                dayOfMonth: data.dayOfMonth,
                startDate: data.startDate,
                endDate: data.endDate ?? null,
            })
            .returning();
        return toDomain(row);
    }

    async advanceLastRunIfBefore(userId: string, id: string, date: string): Promise<boolean> {
        // Conditional UPDATE is atomic per row: a concurrent run waits on the row
        // lock and then re-evaluates the WHERE against the freshly-advanced value,
        // so the same occurrence is claimed by exactly one caller.
        const claimed = await this.db.query
            .update(recurringTransactions)
            .set({ lastRunDate: date, updatedAt: new Date() })
            .where(
                and(
                    eq(recurringTransactions.id, id),
                    eq(recurringTransactions.ownerUserId, userId),
                    or(isNull(recurringTransactions.lastRunDate), lt(recurringTransactions.lastRunDate, date)),
                ),
            )
            .returning({ id: recurringTransactions.id });
        return claimed.length > 0;
    }

    async delete(userId: string, id: string): Promise<RecurringTransaction | null> {
        const [row] = await this.db.query
            .delete(recurringTransactions)
            .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.ownerUserId, userId)))
            .returning();
        return row ? toDomain(row) : null;
    }
}
