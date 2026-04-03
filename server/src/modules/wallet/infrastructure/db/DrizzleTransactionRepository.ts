import {
    Transaction,
    CreateTransactionData,
    UpdateTransactionData,
    TransactionFilters,
    PagedTransactions,
} from '../../domain/Transaction';
import { TransactionRepository } from '../../domain/TransactionRepository';
import { Database } from '../../../common/base/db/Database';
import { transactions } from '../../schema';
import { getScopedUserId } from '../../../common/http/request-auth';
import { and, desc, eq, gte, ilike, lte, sql, SQL } from 'drizzle-orm';

export class DrizzleTransactionRepository extends TransactionRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async list(filters: TransactionFilters): Promise<PagedTransactions> {
        const conditions: SQL[] = [eq(transactions.ownerUserId, getScopedUserId())];

        if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
        if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
        if (filters.type) conditions.push(eq(transactions.type, filters.type));
        if (filters.from) conditions.push(gte(transactions.date, filters.from));
        if (filters.to) conditions.push(lte(transactions.date, filters.to));
        if (filters.search) conditions.push(ilike(transactions.description, `%${filters.search}%`));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;

        const [data, countResult] = await Promise.all([
            this.db.query
                .select()
                .from(transactions)
                .where(whereClause)
                .orderBy(desc(transactions.date), desc(transactions.createdAt))
                .limit(limit)
                .offset(offset),
            this.db.query
                .select({ count: sql<number>`count(*)::int` })
                .from(transactions)
                .where(whereClause),
        ]);

        return {
            transactions: data,
            total: countResult[0].count,
            limit,
            offset,
        };
    }

    async findById(id: string): Promise<Transaction | null> {
        const [row] = await this.db.query
            .select()
            .from(transactions)
            .where(and(eq(transactions.id, id), eq(transactions.ownerUserId, getScopedUserId())));

        return row ?? null;
    }

    async create(data: CreateTransactionData): Promise<Transaction> {
        const [row] = await this.db.query
            .insert(transactions)
            .values({
                ownerUserId: getScopedUserId(),
                accountId: data.accountId,
                categoryId: data.categoryId ?? null,
                type: data.type,
                amount: data.amount,
                currency: data.currency,
                description: data.description ?? null,
                date: data.date,
                transferToAccountId: data.transferToAccountId ?? null,
                tags: data.tags ?? [],
            })
            .returning();

        return row;
    }

    private static readonly UPDATABLE_FIELDS = [
        'accountId', 'categoryId', 'type', 'amount', 'currency',
        'description', 'date', 'transferToAccountId', 'tags',
    ] as const;

    async update(id: string, data: UpdateTransactionData): Promise<Transaction | null> {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        for (const field of DrizzleTransactionRepository.UPDATABLE_FIELDS) {
            if (data[field] !== undefined) updateData[field] = data[field];
        }

        const [updated] = await this.db.query
            .update(transactions)
            .set(updateData)
            .where(and(eq(transactions.id, id), eq(transactions.ownerUserId, getScopedUserId())))
            .returning();

        return updated ?? null;
    }

    async delete(id: string): Promise<Transaction | null> {
        const [deleted] = await this.db.query
            .delete(transactions)
            .where(and(eq(transactions.id, id), eq(transactions.ownerUserId, getScopedUserId())))
            .returning();

        return deleted ?? null;
    }

    async sumByAccountId(accountId: string): Promise<string> {
        const [result] = await this.db.query
            .select({
                balance: sql<string>`
                    COALESCE(
                        SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) -
                        SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END),
                        0
                    )::text
                `,
            })
            .from(transactions)
            .where(and(eq(transactions.accountId, accountId), eq(transactions.ownerUserId, getScopedUserId())));

        return result.balance;
    }

    async sumByDateRange(from: string, to: string, accountId?: string): Promise<string> {
        const conditions: SQL[] = [
            eq(transactions.ownerUserId, getScopedUserId()),
            gte(transactions.date, from),
            lte(transactions.date, to),
        ];
        if (accountId) conditions.push(eq(transactions.accountId, accountId));

        const [result] = await this.db.query
            .select({
                balance: sql<string>`
                    COALESCE(
                        SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) -
                        SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END),
                        0
                    )::text
                `,
            })
            .from(transactions)
            .where(and(...conditions));

        return result.balance;
    }
}
