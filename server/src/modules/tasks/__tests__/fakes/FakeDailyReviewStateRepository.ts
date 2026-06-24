import { DailyReviewStateRecord, DailyReviewStateRepository } from '../../domain/DailyReviewStateRepository';

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
}
