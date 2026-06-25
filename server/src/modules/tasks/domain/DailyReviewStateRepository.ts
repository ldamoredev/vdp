/**
 * The daily ritual's ceremony state for one user-day (R1/R2). Plain data —
 * evening close state plus the morning focus plan. Persisted server-side so
 * the ritual is the same across devices.
 */
export type DailyReviewStateRecord = {
    date: string;
    acknowledgedSignalIds: string[];
    watchedCategoryIds: string[];
    note: string;
    openedAt: string | null;
    completedAt: string | null;
    focusTaskId: string | null;
    plannedAt: string | null;
};

export abstract class DailyReviewStateRepository {
    abstract get(userId: string, date: string): Promise<DailyReviewStateRecord | null>;
    /** Upsert by (userId, date). */
    abstract save(userId: string, state: DailyReviewStateRecord): Promise<DailyReviewStateRecord>;
}
