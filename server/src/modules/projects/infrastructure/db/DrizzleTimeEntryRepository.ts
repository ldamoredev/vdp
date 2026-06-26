import { and, asc, eq, gte, lte, SQL } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { TimeEntry } from '../../domain/TimeEntry';
import {
    type CreateTimeEntryData,
    type TimeEntryFilters,
    TimeEntryRepository,
} from '../../domain/TimeEntryRepository';
import { timeEntries } from './schema';

export class DrizzleTimeEntryRepository extends TimeEntryRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createTimeEntry(userId: string, data: CreateTimeEntryData): Promise<TimeEntry> {
        const [row] = await this.db.query
            .insert(timeEntries)
            .values({
                ownerUserId: userId,
                projectId: data.projectId,
                taskId: data.taskId ?? null,
                date: data.date,
                minutes: data.minutes,
                note: data.note ?? null,
            })
            .returning();

        return TimeEntry.fromSnapshot(row);
    }

    async getTimeEntry(userId: string, id: string): Promise<TimeEntry | null> {
        const [row] = await this.db.query
            .select()
            .from(timeEntries)
            .where(and(eq(timeEntries.id, id), eq(timeEntries.ownerUserId, userId)))
            .limit(1);

        return row ? TimeEntry.fromSnapshot(row) : null;
    }

    async listTimeEntries(userId: string, filters: TimeEntryFilters): Promise<TimeEntry[]> {
        const conditions: SQL[] = [eq(timeEntries.ownerUserId, userId)];
        if (filters.projectId) conditions.push(eq(timeEntries.projectId, filters.projectId));
        if (filters.fromDate) conditions.push(gte(timeEntries.date, filters.fromDate));
        if (filters.toDate) conditions.push(lte(timeEntries.date, filters.toDate));

        const rows = await this.db.query
            .select()
            .from(timeEntries)
            .where(and(...conditions))
            .orderBy(asc(timeEntries.date), asc(timeEntries.createdAt));

        return rows.map((row) => TimeEntry.fromSnapshot(row));
    }

    async save(userId: string, entry: TimeEntry): Promise<TimeEntry> {
        const snapshot = entry.toSnapshot();
        const [row] = await this.db.query
            .update(timeEntries)
            .set({
                projectId: snapshot.projectId,
                taskId: snapshot.taskId,
                date: snapshot.date,
                minutes: snapshot.minutes,
                note: snapshot.note,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(timeEntries.id, snapshot.id), eq(timeEntries.ownerUserId, userId)))
            .returning();

        return TimeEntry.fromSnapshot(row);
    }

    async deleteTimeEntry(userId: string, id: string): Promise<boolean> {
        const [deleted] = await this.db.query
            .delete(timeEntries)
            .where(and(eq(timeEntries.id, id), eq(timeEntries.ownerUserId, userId)))
            .returning({ id: timeEntries.id });

        return Boolean(deleted);
    }
}
