import { describe, expect, it } from 'vitest';

import { GetDailyReviewStateQuery, GetDailyReviewStateQueryHandler } from '../../app/GetDailyReviewStateQuery';
import { SaveDailyReviewStateCommand, SaveDailyReviewStateCommandHandler } from '../../app/SaveDailyReviewStateCommand';
import type { DailyReviewStateRecord } from '../../domain/DailyReviewStateRepository';
import { FakeDailyReviewStateRepository } from '../fakes/FakeDailyReviewStateRepository';
import { identity } from './task-cqbus-test-helpers';

describe('Daily review state use cases', () => {
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
        };

        await new SaveDailyReviewStateCommandHandler(repo).handle(new SaveDailyReviewStateCommand(state), identity);
        const result = await new GetDailyReviewStateQueryHandler(repo)
            .handle(new GetDailyReviewStateQuery('2026-06-21'), identity);

        expect(result).toEqual(state);
    });
});
