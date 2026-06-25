import { afterEach, describe, expect, it, vi } from 'vitest';

import { GetDailyReviewStateQuery, GetDailyReviewStateQueryHandler } from '../../app/GetDailyReviewStateQuery';
import { SaveDailyReviewStateCommand, SaveDailyReviewStateCommandHandler } from '../../app/SaveDailyReviewStateCommand';
import type { DailyReviewStateRecord } from '../../domain/DailyReviewStateRepository';
import { FakeDailyReviewStateRepository } from '../fakes/FakeDailyReviewStateRepository';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest } from './task-cqbus-test-helpers';

describe('Daily review state use cases', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null when nothing is saved for the date', async () => {
        const repo = new FakeDailyReviewStateRepository();

        const result = await new GetDailyReviewStateQueryHandler(repo)
            .handle(new GetDailyReviewStateQuery('2026-06-21'), identity);

        expect(result).toBeNull();
    });

    it('saves and reads back the ceremony state for the authenticated user', async () => {
        const repo = new FakeDailyReviewStateRepository();
        const state: DailyReviewStateRecord = {
            date: '2026-06-21',
            acknowledgedSignalIds: ['s1', 'insight:i9'],
            watchedCategoryIds: ['c1'],
            note: 'cerré bien el día',
            openedAt: '2026-06-21T10:00:00.000Z',
            completedAt: null,
            focusTaskId: '11111111-1111-1111-1111-111111111111',
            plannedAt: '2026-06-21T09:00:00.000Z',
        };
        const ctx = setupTasksCQBusTest();
        ctx.tasks.seed([createTask({ id: state.focusTaskId! })]);

        await new SaveDailyReviewStateCommandHandler(repo, ctx.tasks).handle(new SaveDailyReviewStateCommand(state), identity);
        const result = await new GetDailyReviewStateQueryHandler(repo)
            .handle(new GetDailyReviewStateQuery('2026-06-21'), identity);

        expect(result).toEqual(state);
    });

    it('rejects a focus task id that is not visible to the authenticated user', async () => {
        const repo = new FakeDailyReviewStateRepository();
        const ctx = setupTasksCQBusTest();
        const state: DailyReviewStateRecord = {
            date: '2026-06-21',
            acknowledgedSignalIds: [],
            watchedCategoryIds: [],
            note: '',
            openedAt: null,
            completedAt: null,
            focusTaskId: '22222222-2222-2222-2222-222222222222',
            plannedAt: '2026-06-21T09:00:00.000Z',
        };

        await expect(
            new SaveDailyReviewStateCommandHandler(repo, ctx.tasks)
                .handle(new SaveDailyReviewStateCommand(state), identity),
        ).rejects.toThrow('Focus task not found');
    });
});
