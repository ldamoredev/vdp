/**
 * The review ritual's ceremony state for one user-day (R1). Plain data — the
 * note, the acknowledged signal ids, the watched category ids, and the
 * opened/completed timestamps (ISO strings on the wire). Persisted server-side
 * so the ritual is the same across devices.
 */
export type DailyReviewStateRecord = {
    date: string;
    acknowledgedSignalIds: string[];
    watchedCategoryIds: string[];
    note: string;
    openedAt: string | null;
    completedAt: string | null;
};

export abstract class DailyReviewStateRepository {
    abstract get(userId: string, date: string): Promise<DailyReviewStateRecord | null>;
    /** Upsert by (userId, date). */
    abstract save(userId: string, state: DailyReviewStateRecord): Promise<DailyReviewStateRecord>;
}
