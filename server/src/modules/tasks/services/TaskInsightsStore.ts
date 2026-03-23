import { diffLocalDateISODays } from '../../common/base/time/dates';
import { Logger } from '../../common/base/observability/logging/Logger';
import { NoOpLogger } from '../../common/infrastructure/observability/logging/NoOpLogger';

/**
 * In-memory store for task insights, streaks, and proactive suggestions.
 *
 * Event handlers populate this store reactively.
 * The agent reads it via the `get_insights` tool to surface
 * relevant information when the user next chats.
 *
 * v3: Persist to DB for cross-restart durability.
 */

export type InsightType = 'achievement' | 'warning' | 'suggestion';

export interface Insight {
    id: string;
    type: InsightType;
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
    metadata?: Record<string, unknown>;
}

export interface StreakData {
    current: number;
    best: number;
    lastCompletedDate: string | null;
}

export type InsightListener = (insight: Insight) => void;
export type NewInsight = {
    type: InsightType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
};

export class TaskInsightsStore {
    constructor(private readonly logger: Logger = new NoOpLogger()) {}

    private insights: Insight[] = [];
    private streak: StreakData = { current: 0, best: 0, lastCompletedDate: null };
    private readonly maxInsights = 50;
    private readonly listeners = new Set<InsightListener>();

    // ─── Insights ──────────────────────────────────────────

    addInsight(input: NewInsight): Insight {
        const insight: Insight = {
            id: crypto.randomUUID(),
            type: input.type,
            title: input.title,
            message: input.message,
            createdAt: new Date(),
            read: false,
            metadata: input.metadata,
        };

        this.insights.push(insight);
        this.trimInsights();
        this.notifyListeners(insight);

        return insight;
    }

    private trimInsights(): void {
        if (this.insights.length > this.maxInsights) {
            this.insights.shift();
        }
    }

    private notifyListeners(insight: Insight): void {
        for (const listener of this.listeners) {
            try {
                listener(insight);
            } catch (err) {
                this.logger.error('task insight listener error', {
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }
    }

    /**
     * Subscribe to new insights. Returns unsubscribe function.
     */
    onInsight(listener: InsightListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    getUnreadInsights(): Insight[] {
        return this.insights.filter((i) => !i.read);
    }

    getAllInsights(limit = 20): Insight[] {
        return this.insights.slice(-limit);
    }

    markAllRead(): void {
        for (const insight of this.insights) {
            insight.read = true;
        }
    }

    // ─── Streaks ───────────────────────────────────────────

    /**
     * Called when all daily tasks are completed for a date.
     * Updates streak counter based on date continuity.
     */
    recordPerfectDay(date: string): void {
        const last = this.streak.lastCompletedDate;

        if (!last) {
            // First perfect day ever
            this.streak.current = 1;
        } else {
            const diffDays = diffLocalDateISODays(last, date);

            if (diffDays === 1) {
                // Consecutive day → extend streak
                this.streak.current += 1;
            } else if (diffDays === 0) {
                // Same day (idempotent)
                return;
            } else {
                // Gap → reset streak
                this.streak.current = 1;
            }
        }

        this.streak.lastCompletedDate = date;

        if (this.streak.current > this.streak.best) {
            this.streak.best = this.streak.current;
        }
    }

    getStreak(): StreakData {
        return { ...this.streak };
    }

    // ─── Snapshot (for agent tool) ─────────────────────────

    getSnapshot(): TaskInsightsSnapshot {
        return {
            unread: this.getUnreadInsights(),
            streak: this.getStreak(),
            totalInsights: this.insights.length,
        };
    }
}

export type TaskInsightsSnapshot = {
    unread: Insight[];
    streak: StreakData;
    totalInsights: number;
};
