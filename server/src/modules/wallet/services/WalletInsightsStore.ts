import { randomUUID } from 'crypto';

export type WalletInsightType = 'achievement' | 'warning' | 'suggestion';

export type WalletInsight = {
    readonly id: string;
    readonly type: WalletInsightType;
    readonly title: string;
    readonly message: string;
    readonly createdAt: Date;
    read: boolean;
    readonly metadata?: Record<string, unknown>;
};

type StoredWalletInsight = WalletInsight & {
    readonly userId: string;
};

export type NewWalletInsight = {
    readonly userId: string;
    readonly type: WalletInsightType;
    readonly title: string;
    readonly message: string;
    readonly metadata?: Record<string, unknown>;
};

export type WalletInsightListener = (insight: WalletInsight, userId: string) => void;

const MAX_INSIGHTS_PER_USER = 50;

export class WalletInsightsStore {
    private insights: StoredWalletInsight[] = [];
    private readonly listeners = new Set<WalletInsightListener>();

    addInsight(input: NewWalletInsight): WalletInsight {
        const insight: StoredWalletInsight = {
            id: randomUUID(),
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            createdAt: new Date(),
            read: false,
            metadata: input.metadata,
        };

        this.insights.push(insight);
        this.trimInsights(input.userId);
        this.notifyListeners(insight);

        return this.toInsight(insight);
    }

    getUnreadInsights(userId: string): WalletInsight[] {
        return this.insights
            .filter((insight) => insight.userId === userId && !insight.read)
            .map((insight) => this.toInsight(insight));
    }

    markInsightRead(userId: string, insightId: string): void {
        const insight = this.insights.find((candidate) => candidate.userId === userId && candidate.id === insightId);

        if (insight) {
            insight.read = true;
        }
    }

    onInsight(listener: WalletInsightListener): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    private trimInsights(userId: string): void {
        while (this.countInsightsForUser(userId) > MAX_INSIGHTS_PER_USER) {
            const oldestIndex = this.insights.findIndex((insight) => insight.userId === userId);

            if (oldestIndex === -1) {
                return;
            }

            this.insights.splice(oldestIndex, 1);
        }
    }

    private countInsightsForUser(userId: string): number {
        return this.insights.reduce((count, insight) => (insight.userId === userId ? count + 1 : count), 0);
    }

    private notifyListeners(insight: StoredWalletInsight): void {
        const payload = this.toInsight(insight);

        for (const listener of this.listeners) {
            listener(payload, insight.userId);
        }
    }

    private toInsight(insight: StoredWalletInsight): WalletInsight {
        return {
            id: insight.id,
            type: insight.type,
            title: insight.title,
            message: insight.message,
            createdAt: new Date(insight.createdAt),
            read: insight.read,
            metadata: insight.metadata ? { ...insight.metadata } : undefined,
        };
    }
}
