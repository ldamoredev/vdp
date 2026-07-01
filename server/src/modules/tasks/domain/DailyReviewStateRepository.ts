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
    morningBriefRequestedAt: string | null;
    eveningBriefRequestedAt: string | null;
    weeklyPrepRequestedAt: string | null;
};

export type DailyReviewBriefSurface = 'morning' | 'evening' | 'weekly';

export abstract class DailyReviewStateRepository {
    abstract get(userId: string, date: string): Promise<DailyReviewStateRecord | null>;
    /** Upsert by (userId, date). */
    abstract save(userId: string, state: DailyReviewStateRecord): Promise<DailyReviewStateRecord>;
    /**
     * Idempotent: only sets the surface's timestamp if it isn't set yet (D6a).
     * Never touches note/signals/focus — narrow write, safe alongside the
     * full-state save() from a different writer (ChatPanel vs. Home/Review).
     */
    abstract markBriefRequested(
        userId: string,
        date: string,
        surface: DailyReviewBriefSurface,
    ): Promise<DailyReviewStateRecord>;
}
