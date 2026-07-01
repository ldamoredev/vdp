import {
    DailyReviewBriefSurface,
    DailyReviewStateRecord,
    DailyReviewStateRepository,
} from '../../domain/DailyReviewStateRepository';

function emptyRecord(date: string): DailyReviewStateRecord {
    return {
        date,
        acknowledgedSignalIds: [],
        watchedCategoryIds: [],
        note: '',
        openedAt: null,
        completedAt: null,
        focusTaskId: null,
        plannedAt: null,
        morningBriefRequestedAt: null,
        eveningBriefRequestedAt: null,
        weeklyPrepRequestedAt: null,
    };
}

const BRIEF_SURFACE_FIELD = {
    morning: 'morningBriefRequestedAt',
    evening: 'eveningBriefRequestedAt',
    weekly: 'weeklyPrepRequestedAt',
} as const satisfies Record<DailyReviewBriefSurface, keyof DailyReviewStateRecord>;

export class FakeDailyReviewStateRepository extends DailyReviewStateRepository {
    private store = new Map<string, DailyReviewStateRecord>();

    private key(userId: string, date: string): string {
        return `${userId}|${date}`;
    }

    async get(userId: string, date: string): Promise<DailyReviewStateRecord | null> {
        return this.store.get(this.key(userId, date)) ?? null;
    }

    async save(userId: string, state: DailyReviewStateRecord): Promise<DailyReviewStateRecord> {
        const saved = { ...state };
        this.store.set(this.key(userId, state.date), saved);
        return { ...saved };
    }

    async markBriefRequested(
        userId: string,
        date: string,
        surface: DailyReviewBriefSurface,
    ): Promise<DailyReviewStateRecord> {
        const key = this.key(userId, date);
        const current = this.store.get(key) ?? emptyRecord(date);
        const field = BRIEF_SURFACE_FIELD[surface];
        const updated = { ...current, [field]: current[field] ?? new Date().toISOString() };
        this.store.set(key, updated);
        return { ...updated };
    }
}
