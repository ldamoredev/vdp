import { TaskRepository } from '../domain/TaskRepository';
import { TaskInsightsStore } from './TaskInsightsStore';
import { localDateISO, todayISO } from '../../common/base/time/dates';

const REBUILD_WINDOW_DAYS = 365;

/**
 * Rebuilds in-memory completion streaks from persisted task history at boot.
 *
 * TaskInsightsStore lives in memory, so a restart used to reset streaks to
 * zero. Perfect days are derived from the tasks table — a date counts when it
 * has at least one task and none left pending, mirroring CheckDailyCompletion
 * — and replayed in chronological order through recordPerfectDay, which
 * applies the same continuity rules as the live event path.
 *
 * The lookback is capped at one year: a streak longer than that survives as
 * `best >= current` but its exact best value may be understated.
 */
export class RebuildStreaks {
    constructor(
        private repository: TaskRepository,
        private insightsStore: TaskInsightsStore,
    ) {}

    async execute(): Promise<void> {
        const userIds = await this.repository.listOwnerUserIds();
        const to = todayISO();
        const from = localDateISO(
            new Date(Date.now() - REBUILD_WINDOW_DAYS * 24 * 60 * 60 * 1000),
        );

        for (const userId of userIds) {
            const trend = await this.repository.getTrendByDateRange(userId, from, to);
            const perfectDays = trend
                .filter((row) => row.total > 0 && row.pending === 0 && row.completed > 0)
                .map((row) => row.date)
                .sort();

            for (const date of perfectDays) {
                this.insightsStore.recordPerfectDay(userId, date);
            }
        }
    }
}
