import { and, desc, eq } from 'drizzle-orm';
import { Database } from '../../../common/base/db/Database';
import { Habit } from '../../domain/Habit';
import { CreateHabitData, HabitRepository } from '../../domain/HabitRepository';
import { habitLogs, habits } from './schema';

const DEFAULT_COMPLETIONS_LIMIT = 400;

export class DrizzleHabitRepository extends HabitRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createHabit(userId: string, data: CreateHabitData): Promise<Habit> {
        const [row] = await this.db.query
            .insert(habits)
            .values({
                ownerUserId: userId,
                name: data.name,
                emoji: data.emoji ?? null,
                cadence: data.cadence ?? 'daily',
                weeklyTarget: data.weeklyTarget ?? null,
            })
            .returning();

        return this.toHabit(row);
    }

    async getHabit(userId: string, id: string): Promise<Habit | null> {
        const [row] = await this.db.query
            .select()
            .from(habits)
            .where(and(eq(habits.id, id), eq(habits.ownerUserId, userId)))
            .limit(1);

        return row ? this.toHabit(row) : null;
    }

    async listHabits(userId: string, includeArchived = false): Promise<Habit[]> {
        const rows = await this.db.query
            .select()
            .from(habits)
            .where(eq(habits.ownerUserId, userId))
            .orderBy(habits.createdAt);

        return rows
            .filter((row) => includeArchived || row.archivedAt === null)
            .map((row) => this.toHabit(row));
    }

    async save(userId: string, habit: Habit): Promise<Habit> {
        const snapshot = habit.toSnapshot();
        const [row] = await this.db.query
            .update(habits)
            .set({
                name: snapshot.name,
                emoji: snapshot.emoji,
                cadence: snapshot.cadence,
                weeklyTarget: snapshot.weeklyTarget,
                archivedAt: snapshot.archivedAt,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(habits.id, snapshot.id), eq(habits.ownerUserId, userId)))
            .returning();

        return this.toHabit(row);
    }

    async logCompletion(userId: string, habitId: string, date: string): Promise<boolean> {
        const inserted = await this.db.query
            .insert(habitLogs)
            .values({ ownerUserId: userId, habitId, date })
            .onConflictDoNothing()
            .returning({ id: habitLogs.id });

        return inserted.length > 0;
    }

    async removeCompletion(userId: string, habitId: string, date: string): Promise<boolean> {
        const deleted = await this.db.query
            .delete(habitLogs)
            .where(and(
                eq(habitLogs.habitId, habitId),
                eq(habitLogs.ownerUserId, userId),
                eq(habitLogs.date, date),
            ))
            .returning({ id: habitLogs.id });

        return deleted.length > 0;
    }

    async getCompletionDates(userId: string, habitId: string, limit = DEFAULT_COMPLETIONS_LIMIT): Promise<string[]> {
        const rows = await this.db.query
            .select({ date: habitLogs.date })
            .from(habitLogs)
            .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.ownerUserId, userId)))
            .orderBy(desc(habitLogs.date))
            .limit(limit);

        return rows.map((row) => row.date);
    }

    private toHabit(row: typeof habits.$inferSelect): Habit {
        return Habit.fromSnapshot({
            id: row.id,
            name: row.name,
            emoji: row.emoji,
            cadence: row.cadence,
            weeklyTarget: row.weeklyTarget,
            archivedAt: row.archivedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
