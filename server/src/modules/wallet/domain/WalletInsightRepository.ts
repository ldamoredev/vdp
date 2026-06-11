export type PersistedWalletInsight = {
    readonly id: string;
    readonly userId: string;
    readonly type: string;
    readonly title: string;
    readonly message: string;
    readonly metadata?: Record<string, unknown>;
    readonly read: boolean;
    readonly createdAt: Date;
};

/**
 * Durability layer behind WalletInsightsStore. The store keeps serving reads
 * from memory; this repository only has to survive restarts, so writes are
 * fire-and-forget and reads happen once at boot.
 */
export abstract class WalletInsightRepository {
    abstract insert(insight: PersistedWalletInsight): Promise<void>;
    abstract markRead(userId: string, insightId: string): Promise<void>;
    /** Every persisted insight, oldest first (the per-user cap bounds the table). */
    abstract listAll(): Promise<PersistedWalletInsight[]>;
    /** Deletes everything but the newest `keep` insights for the user. */
    abstract trimToNewest(userId: string, keep: number): Promise<void>;
}
