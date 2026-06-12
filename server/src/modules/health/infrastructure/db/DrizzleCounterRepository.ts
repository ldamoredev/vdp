import { and, desc, eq } from 'drizzle-orm';
import { Database } from '../../../common/base/db/Database';
import { Counter } from '../../domain/Counter';
import { CounterAttempt, CounterRepository, CreateCounterData } from '../../domain/CounterRepository';
import { counterAttempts, counters } from './schema';

export class DrizzleCounterRepository extends CounterRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createCounter(userId: string, data: CreateCounterData): Promise<Counter> {
        const [row] = await this.db.query
            .insert(counters)
            .values({
                ownerUserId: userId,
                name: data.name,
                emoji: data.emoji ?? null,
                dailyCost: data.dailyCost ?? null,
                startedAt: data.startedAt,
                lastMilestoneNotified: data.lastMilestoneNotified,
            })
            .returning();

        return this.toCounter(row);
    }

    async getCounter(userId: string, id: string): Promise<Counter | null> {
        const [row] = await this.db.query
            .select()
            .from(counters)
            .where(and(eq(counters.id, id), eq(counters.ownerUserId, userId)))
            .limit(1);

        return row ? this.toCounter(row) : null;
    }

    async listCounters(userId: string, includeArchived = false): Promise<Counter[]> {
        const rows = await this.db.query
            .select()
            .from(counters)
            .where(eq(counters.ownerUserId, userId))
            .orderBy(counters.createdAt);

        return rows
            .filter((row) => includeArchived || row.archivedAt === null)
            .map((row) => this.toCounter(row));
    }

    async save(userId: string, counter: Counter): Promise<Counter> {
        const snapshot = counter.toSnapshot();
        const [row] = await this.db.query
            .update(counters)
            .set({
                name: snapshot.name,
                emoji: snapshot.emoji,
                dailyCost: snapshot.dailyCost,
                startedAt: snapshot.startedAt,
                lastMilestoneNotified: snapshot.lastMilestoneNotified,
                archivedAt: snapshot.archivedAt,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(counters.id, snapshot.id), eq(counters.ownerUserId, userId)))
            .returning();

        return this.toCounter(row);
    }

    async addAttempt(userId: string, counterId: string, attempt: {
        startedAt: string;
        endedAt: string;
        days: number;
    }): Promise<void> {
        await this.db.query.insert(counterAttempts).values({
            ownerUserId: userId,
            counterId,
            startedAt: attempt.startedAt,
            endedAt: attempt.endedAt,
            days: attempt.days,
        });
    }

    async getAttempts(userId: string, counterId: string): Promise<CounterAttempt[]> {
        const rows = await this.db.query
            .select()
            .from(counterAttempts)
            .where(and(
                eq(counterAttempts.counterId, counterId),
                eq(counterAttempts.ownerUserId, userId),
            ))
            .orderBy(desc(counterAttempts.endedAt));

        return rows.map((row) => ({
            id: row.id,
            counterId: row.counterId,
            startedAt: row.startedAt,
            endedAt: row.endedAt,
            days: row.days,
        }));
    }

    private toCounter(row: typeof counters.$inferSelect): Counter {
        return Counter.fromSnapshot({
            id: row.id,
            name: row.name,
            emoji: row.emoji,
            dailyCost: row.dailyCost,
            startedAt: row.startedAt,
            lastMilestoneNotified: row.lastMilestoneNotified,
            archivedAt: row.archivedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
