import { and, eq } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { DailyReviewStateRecord, DailyReviewStateRepository } from '../../domain/DailyReviewStateRepository';
import { dailyReviewState } from './schema';

type Row = typeof dailyReviewState.$inferSelect;

function toRecord(row: Row): DailyReviewStateRecord {
    return {
        date: row.date,
        acknowledgedSignalIds: row.acknowledgedSignalIds,
        watchedCategoryIds: row.watchedCategoryIds,
        note: row.note,
        openedAt: row.openedAt ? row.openedAt.toISOString() : null,
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
        focusTaskId: row.focusTaskId,
        plannedAt: row.plannedAt ? row.plannedAt.toISOString() : null,
    };
}

export class DrizzleDailyReviewStateRepository extends DailyReviewStateRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async get(userId: string, date: string): Promise<DailyReviewStateRecord | null> {
        const [row] = await this.db.query
            .select()
            .from(dailyReviewState)
            .where(and(eq(dailyReviewState.ownerUserId, userId), eq(dailyReviewState.date, date)));
        return row ? toRecord(row) : null;
    }

    async save(userId: string, state: DailyReviewStateRecord): Promise<DailyReviewStateRecord> {
        const values = {
            acknowledgedSignalIds: state.acknowledgedSignalIds,
            watchedCategoryIds: state.watchedCategoryIds,
            note: state.note,
            openedAt: state.openedAt ? new Date(state.openedAt) : null,
            completedAt: state.completedAt ? new Date(state.completedAt) : null,
            focusTaskId: state.focusTaskId,
            plannedAt: state.plannedAt ? new Date(state.plannedAt) : null,
            updatedAt: new Date(),
        };
        const [row] = await this.db.query
            .insert(dailyReviewState)
            .values({ ownerUserId: userId, date: state.date, ...values })
            .onConflictDoUpdate({
                target: [dailyReviewState.ownerUserId, dailyReviewState.date],
                set: values,
            })
            .returning();
        return toRecord(row);
    }
}
