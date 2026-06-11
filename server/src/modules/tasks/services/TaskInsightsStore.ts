import { diffLocalDateISODays } from '../../common/base/time/dates';
import { Logger } from '../../common/base/observability/logging/Logger';
import { NoOpLogger } from '../../common/infrastructure/observability/logging/NoOpLogger';
import { TaskInsightRepository } from '../domain/TaskInsightRepository';

/**
 * Store for task insights, streaks, and proactive suggestions.
 *
 * Event handlers populate this store reactively.
 * The agent reads it via the `get_insights` tool to surface
 * relevant information when the user next chats.
 *
 * Reads are served from memory; when a repository is provided, writes are
 * persisted fire-and-forget and `hydrate()` reloads the memory state at boot.
 * Streaks stay memory-only: RebuildStreaks reconstructs them from task
 * history on start.
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

export interface TaskInsightAction {
    href: string;
    label: string;
    domain: string;
}

export interface RecentInsight extends Insight {
    action?: TaskInsightAction;
}

export type InsightListener = (insight: Insight, userId: string) => void;
type StoredInsight = Insight & {
    userId: string;
};
export type NewInsight = {
    userId: string;
    type: InsightType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
};

export class TaskInsightsStore {
    constructor(
        private readonly logger: Logger = new NoOpLogger(),
        private readonly repository?: TaskInsightRepository,
    ) {}

    private insights: StoredInsight[] = [];
    private readonly streaks = new Map<string, StreakData>();
    private readonly maxInsights = 50;
    private readonly listeners = new Set<InsightListener>();
    private readonly defaultScopeKey = '__global__';

    reset(): void {
        this.insights = [];
        this.streaks.clear();
    }

    // ─── Insights ──────────────────────────────────────────

    addInsight(input: NewInsight): Insight {
        const insight: StoredInsight = {
            id: crypto.randomUUID(),
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
        // Listeners run before persisting: the SSE handler may mark the
        // insight read synchronously, and the insert must carry that state.
        this.notifyListeners(insight);
        this.persistInsight(insight);

        return this.toInsight(insight);
    }

    /**
     * Reload the in-memory state from the repository. Called once at boot,
     * before the HTTP server accepts traffic.
     */
    async hydrate(): Promise<void> {
        if (!this.repository) return;

        const rows = await this.repository.listAll();
        this.insights = rows.map((row) => ({
            id: row.id,
            userId: row.userId,
            type: row.type as InsightType,
            title: row.title,
            message: row.message,
            createdAt: row.createdAt,
            read: row.read,
            metadata: row.metadata,
        }));
    }

    private persistInsight(insight: StoredInsight): void {
        if (!this.repository) return;

        this.repository
            .insert({
                id: insight.id,
                userId: insight.userId,
                type: insight.type,
                title: insight.title,
                message: insight.message,
                metadata: insight.metadata,
                read: insight.read,
                createdAt: insight.createdAt,
            })
            .then(() => this.repository?.trimToNewest(insight.userId, this.maxInsights))
            .catch((err: unknown) => {
                this.logger.error('failed to persist task insight', {
                    error: err instanceof Error ? err.message : String(err),
                });
            });
    }

    private persistReadFlag(operation: Promise<void> | undefined): void {
        operation?.catch((err: unknown) => {
            this.logger.error('failed to persist task insight read flag', {
                error: err instanceof Error ? err.message : String(err),
            });
        });
    }

    private trimInsights(userId: string): void {
        while (this.countInsightsForUser(userId) > this.maxInsights) {
            const oldestInsightIndex = this.insights.findIndex((insight) => insight.userId === userId);
            if (oldestInsightIndex === -1) {
                return;
            }

            this.insights.splice(oldestInsightIndex, 1);
        }
    }

    private notifyListeners(insight: StoredInsight): void {
        const payload = this.toInsight(insight);
        for (const listener of this.listeners) {
            try {
                listener(payload, insight.userId);
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

    getUnreadInsights(userId?: string): Insight[] {
        return this.filterInsights(userId)
            .filter((insight) => !insight.read)
            .map((insight) => this.toInsight(insight));
    }

    getAllInsights(limitOrUserId?: number | string, maybeLimit?: number): Insight[] {
        const { userId, limit } = this.resolveInsightQuery(limitOrUserId, maybeLimit, 20);
        return this.filterInsights(userId)
            .slice(-limit)
            .map((insight) => this.toInsight(insight));
    }

    getRecentInsights(userIdOrLimit?: string | number, maybeLimit?: number): RecentInsight[] {
        const { userId, limit } = this.resolveInsightQuery(userIdOrLimit, maybeLimit, 5);

        return this.filterInsights(userId)
            .slice(-limit)
            .reverse()
            .map((insight) => ({
                ...this.toInsight(insight),
                metadata: insight.metadata ? { ...insight.metadata } : undefined,
                action: this.resolveAction(insight),
            }));
    }

    markAllRead(userId?: string): void {
        const affectedUserIds = new Set<string>();
        for (const insight of this.filterInsights(userId)) {
            insight.read = true;
            affectedUserIds.add(insight.userId);
        }

        for (const affectedUserId of affectedUserIds) {
            this.persistReadFlag(this.repository?.markAllRead(affectedUserId));
        }
    }

    markInsightRead(userId: string, insightId: string): void {
        const insight = this.insights.find((candidate) =>
            candidate.userId === userId && candidate.id === insightId,
        );

        if (insight) {
            insight.read = true;
            this.persistReadFlag(this.repository?.markRead(userId, insightId));
        }
    }

    // ─── Streaks ───────────────────────────────────────────

    /**
     * Called when all daily tasks are completed for a date.
     * Updates streak counter based on date continuity.
     */
    recordPerfectDay(userIdOrDate: string, maybeDate?: string): void {
        const userId = maybeDate ? userIdOrDate : undefined;
        const date = maybeDate ?? userIdOrDate;
        const key = this.resolveScopeKey(userId);
        const streak = this.getOrCreateStreak(key);
        const last = streak.lastCompletedDate;

        if (!last) {
            // First perfect day ever
            streak.current = 1;
        } else {
            const diffDays = diffLocalDateISODays(last, date);

            if (diffDays === 1) {
                // Consecutive day → extend streak
                streak.current += 1;
            } else if (diffDays === 0) {
                // Same day (idempotent)
                return;
            } else {
                // Gap → reset streak
                streak.current = 1;
            }
        }

        streak.lastCompletedDate = date;

        if (streak.current > streak.best) {
            streak.best = streak.current;
        }
    }

    getStreak(userId?: string): StreakData {
        return { ...this.getOrCreateStreak(this.resolveScopeKey(userId)) };
    }

    // ─── Snapshot (for agent tool) ─────────────────────────

    getSnapshot(userId?: string): TaskInsightsSnapshot {
        return {
            unread: this.getUnreadInsights(userId),
            streak: this.getStreak(userId),
            totalInsights: this.filterInsights(userId).length,
        };
    }

    private countInsightsForUser(userId: string): number {
        return this.insights.reduce((count, insight) => (
            insight.userId === userId ? count + 1 : count
        ), 0);
    }

    private resolveAction(insight: StoredInsight): TaskInsightAction | undefined {
        const explicitAction = this.resolveExplicitAction(insight.metadata);
        if (explicitAction) {
            return explicitAction;
        }

        const source = this.readMetadataString(insight.metadata, 'source');
        if (source === 'wallet.spending.spike') {
            return {
                href: '/wallet',
                label: 'Abrir Wallet',
                domain: 'wallet',
            };
        }

        if (insight.type === 'achievement') {
            return {
                href: '/tasks/history',
                label: 'Ver historial',
                domain: 'tasks',
            };
        }

        return {
            href: '/tasks',
            label: 'Ir a Tasks',
            domain: 'tasks',
        };
    }

    private resolveExplicitAction(metadata?: Record<string, unknown>): TaskInsightAction | undefined {
        const href = this.readMetadataString(metadata, 'actionHref');
        const label = this.readMetadataString(metadata, 'actionLabel');

        if (!href || !label) {
            return undefined;
        }

        return {
            href,
            label,
            domain: this.resolveExplicitActionDomain(metadata, href),
        };
    }

    private resolveExplicitActionDomain(
        metadata: Record<string, unknown> | undefined,
        href: string,
    ): string {
        return (
            this.readMetadataString(metadata, 'actionDomain') ??
            this.readMetadataString(metadata, 'domain') ??
            this.inferDomainFromHref(href) ??
            this.inferDomainFromSource(this.readMetadataString(metadata, 'source')) ??
            'tasks'
        );
    }

    private inferDomainFromHref(href: string): string | undefined {
        try {
            const url = href.startsWith('http://') || href.startsWith('https://')
                ? new URL(href)
                : new URL(href, 'https://vdp.local');
            return url.pathname.split('/').filter(Boolean)[0];
        } catch {
            return undefined;
        }
    }

    private inferDomainFromSource(source: string | undefined): string | undefined {
        return source?.split('.')[0] || undefined;
    }

    private readMetadataString(
        metadata: Record<string, unknown> | undefined,
        key: string,
    ): string | undefined {
        const value = metadata?.[key];
        return typeof value === 'string' && value.length > 0 ? value : undefined;
    }

    private toInsight(insight: StoredInsight): Insight {
        return {
            id: insight.id,
            type: insight.type,
            title: insight.title,
            message: insight.message,
            createdAt: insight.createdAt,
            read: insight.read,
            metadata: insight.metadata ? { ...insight.metadata } : undefined,
        };
    }

    private filterInsights(userId?: string): StoredInsight[] {
        const key = this.resolveScopeKey(userId);
        return userId
            ? this.insights.filter((insight) => insight.userId === key)
            : this.insights;
    }

    private resolveInsightQuery(
        userIdOrLimit: string | number | undefined,
        maybeLimit: number | undefined,
        defaultLimit: number,
    ): { userId?: string; limit: number } {
        if (typeof userIdOrLimit === 'string') {
            return { userId: userIdOrLimit, limit: maybeLimit ?? defaultLimit };
        }

        return { limit: userIdOrLimit ?? defaultLimit };
    }

    private resolveScopeKey(userId?: string): string {
        return userId ?? this.defaultScopeKey;
    }

    private getOrCreateStreak(scopeKey: string): StreakData {
        const existing = this.streaks.get(scopeKey);
        if (existing) {
            return existing;
        }

        const initial: StreakData = { current: 0, best: 0, lastCompletedDate: null };
        this.streaks.set(scopeKey, initial);
        return initial;
    }
}

export type TaskInsightsSnapshot = {
    unread: Insight[];
    streak: StreakData;
    totalInsights: number;
};
