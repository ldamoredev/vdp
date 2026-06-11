import { describe, it, expect, beforeEach } from 'vitest';
import { RebuildStreaks } from '../../services/RebuildStreaks';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { localDateISO } from '../../../common/base/time/dates';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';

const USER = 'test-user-id';

// Dates are relative to today so they always fall inside the rebuild window.
function daysAgo(days: number): string {
    return localDateISO(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

describe('RebuildStreaks', () => {
    let repo: FakeTaskRepository;
    let insightsStore: TaskInsightsStore;
    let rebuild: RebuildStreaks;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        insightsStore = new TaskInsightsStore();
        rebuild = new RebuildStreaks(repo, insightsStore);
    });

    it('rebuilds a streak from consecutive perfect days', async () => {
        repo.seed([
            createTask({ scheduledDate: daysAgo(3), status: 'done' }),
            createTask({ scheduledDate: daysAgo(2), status: 'done' }),
            createTask({ scheduledDate: daysAgo(2), status: 'done' }),
            createTask({ scheduledDate: daysAgo(1), status: 'done' }),
        ]);

        await rebuild.execute();

        expect(insightsStore.getStreak(USER)).toMatchObject({
            current: 3,
            best: 3,
            lastCompletedDate: daysAgo(1),
        });
    });

    it('resets current on gaps but keeps the best streak', async () => {
        repo.seed([
            createTask({ scheduledDate: daysAgo(6), status: 'done' }),
            createTask({ scheduledDate: daysAgo(5), status: 'done' }),
            createTask({ scheduledDate: daysAgo(4), status: 'done' }),
            // gap: daysAgo(3) had no tasks
            createTask({ scheduledDate: daysAgo(2), status: 'done' }),
        ]);

        await rebuild.execute();

        expect(insightsStore.getStreak(USER)).toMatchObject({
            current: 1,
            best: 3,
            lastCompletedDate: daysAgo(2),
        });
    });

    it('does not count days with pending tasks as perfect', async () => {
        repo.seed([
            createTask({ scheduledDate: daysAgo(2), status: 'done' }),
            createTask({ scheduledDate: daysAgo(1), status: 'done' }),
            createTask({ scheduledDate: daysAgo(1), status: 'pending' }),
        ]);

        await rebuild.execute();

        expect(insightsStore.getStreak(USER)).toMatchObject({
            current: 1,
            best: 1,
            lastCompletedDate: daysAgo(2),
        });
    });

    it('counts a day with done and discarded tasks as perfect, matching CheckDailyCompletion', async () => {
        repo.seed([
            createTask({ scheduledDate: daysAgo(2), status: 'done' }),
            createTask({ scheduledDate: daysAgo(2), status: 'discarded' }),
            createTask({ scheduledDate: daysAgo(1), status: 'done' }),
        ]);

        await rebuild.execute();

        expect(insightsStore.getStreak(USER)).toMatchObject({
            current: 2,
            best: 2,
        });
    });

    it('ignores days with only discarded tasks', async () => {
        repo.seed([
            createTask({ scheduledDate: daysAgo(3), status: 'done' }),
            createTask({ scheduledDate: daysAgo(2), status: 'discarded' }),
            createTask({ scheduledDate: daysAgo(1), status: 'done' }),
        ]);

        await rebuild.execute();

        // The discarded-only day is not perfect, so it breaks continuity.
        expect(insightsStore.getStreak(USER)).toMatchObject({
            current: 1,
            best: 1,
            lastCompletedDate: daysAgo(1),
        });
    });

    it('leaves the streak empty for users without tasks', async () => {
        repo.setOwnerUserIds(['empty-user']);

        await rebuild.execute();

        expect(insightsStore.getStreak('empty-user')).toMatchObject({
            current: 0,
            best: 0,
            lastCompletedDate: null,
        });
    });
});
