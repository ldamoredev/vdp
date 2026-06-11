import { PersistedTaskInsight, TaskInsightRepository } from '../../domain/TaskInsightRepository';

export class FakeTaskInsightRepository extends TaskInsightRepository {
    private rows = new Map<string, PersistedTaskInsight>();

    // ─── Test helpers ──────────────────────────────────

    seed(insights: PersistedTaskInsight[]): void {
        for (const insight of insights) {
            this.rows.set(insight.id, insight);
        }
    }

    get size(): number {
        return this.rows.size;
    }

    find(id: string): PersistedTaskInsight | undefined {
        return this.rows.get(id);
    }

    // ─── Repository ────────────────────────────────────

    async insert(insight: PersistedTaskInsight): Promise<void> {
        this.rows.set(insight.id, { ...insight });
    }

    async markRead(userId: string, insightId: string): Promise<void> {
        const row = this.rows.get(insightId);
        if (row && row.userId === userId) {
            this.rows.set(insightId, { ...row, read: true });
        }
    }

    async markAllRead(userId: string): Promise<void> {
        for (const [id, row] of this.rows) {
            if (row.userId === userId) {
                this.rows.set(id, { ...row, read: true });
            }
        }
    }

    async listAll(): Promise<PersistedTaskInsight[]> {
        return Array.from(this.rows.values()).sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
    }

    async trimToNewest(userId: string, keep: number): Promise<void> {
        const userRows = Array.from(this.rows.values())
            .filter((row) => row.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        for (const row of userRows.slice(keep)) {
            this.rows.delete(row.id);
        }
    }
}
