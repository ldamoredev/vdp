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

export class TaskInsightsStore {
    private insights: Insight[] = [];
    private streak: StreakData = { current: 0, best: 0, lastCompletedDate: null };
    private maxInsights = 50;
    private listeners: InsightListener[] = [];

    // ─── Insights ──────────────────────────────────────────

    addInsight(type: InsightType, title: string, message: string, metadata?: Record<string, unknown>): Insight {
        const insight: Insight = {
            id: crypto.randomUUID(),
            type,
            title,
            message,
            createdAt: new Date(),
            read: false,
            metadata,
        };

        this.insights.push(insight);

        // Circular buffer
        if (this.insights.length > this.maxInsights) {
            this.insights.shift();
        }

        // Notify listeners (SSE, etc.)
        for (const listener of this.listeners) {
            try {
                listener(insight);
            } catch (err) {
                console.error('[INSIGHTS] Listener error:', err);
            }
        }

        return insight;
    }

    /**
     * Subscribe to new insights. Returns unsubscribe function.
     */
    onInsight(listener: InsightListener): () => void {
        this.listeners.push(listener);
        return () => {
            const idx = this.listeners.indexOf(listener);
            if (idx >= 0) this.listeners.splice(idx, 1);
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
            const lastDate = new Date(last);
            const thisDate = new Date(date);
            const diffMs = thisDate.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

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
