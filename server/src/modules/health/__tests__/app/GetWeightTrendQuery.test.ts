import { Identity } from '@nbottarini/cqbus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { FakeWeightRepository } from '../fakes/FakeWeightRepository';
import { GetWeightTrendQuery, GetWeightTrendQueryHandler } from '../../app/GetWeightTrendQuery';

const userId = 'user-1';
const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

describe('get weight trend', () => {
    let repo: FakeWeightRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 14, 12, 0, 0));
        repo = new FakeWeightRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the authenticated user window with trend summary', async () => {
        await repo.saveWeightEntry(userId, { date: '2026-06-10', weightKg: '83.40' });
        await repo.saveWeightEntry(userId, { date: '2026-06-12', weightKg: '82.90' });
        await repo.saveWeightEntry(userId, { date: '2026-06-14', weightKg: '82.10' });
        await repo.saveWeightEntry('someone-else', { date: '2026-06-14', weightKg: '77.00' });
        const handler = new GetWeightTrendQueryHandler(repo);

        const overview = await handler.handle(new GetWeightTrendQuery(7), identity);

        expect(overview.date).toBe('2026-06-14');
        expect(overview.entries.map((entry) => entry.date)).toEqual(['2026-06-10', '2026-06-12', '2026-06-14']);
        expect(overview.summary).toEqual({
            days: 7,
            entryCount: 3,
            currentWeightKg: '82.10',
            previousWeightKg: '83.40',
            changeKg: '-1.30',
            direction: 'down',
        });
    });

    it('returns an empty summary when there is no data', async () => {
        const handler = new GetWeightTrendQueryHandler(repo);

        const overview = await handler.handle(new GetWeightTrendQuery(30), identity);

        expect(overview.entries).toEqual([]);
        expect(overview.summary).toEqual({
            days: 30,
            entryCount: 0,
            currentWeightKg: null,
            previousWeightKg: null,
            changeKg: null,
            direction: 'flat',
        });
    });

    it('rejects unauthenticated access', async () => {
        const handler = new GetWeightTrendQueryHandler(repo);

        await expect(handler.handle(new GetWeightTrendQuery(), anonymous)).rejects.toMatchObject({ statusCode: 401 });
    });
});
