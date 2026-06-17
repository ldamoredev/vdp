import { Identity } from '@nbottarini/cqbus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { FakeWeightRepository } from '../fakes/FakeWeightRepository';
import { SaveWeightEntryCommand, SaveWeightEntryCommandHandler } from '../../app/SaveWeightEntryCommand';

const userId = 'user-1';
const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

describe('save weight entry', () => {
    let repo: FakeWeightRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 14, 12, 0, 0));
        repo = new FakeWeightRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('upserts today for the authenticated user', async () => {
        const handler = new SaveWeightEntryCommandHandler(repo);

        const saved = await handler.handle(new SaveWeightEntryCommand({ weightKg: '82.40' }), identity);
        const updated = await handler.handle(new SaveWeightEntryCommand({ weightKg: '82.10' }), identity);

        expect(saved).toMatchObject({ date: '2026-06-14', weightKg: '82.40' });
        expect(updated).toMatchObject({ date: '2026-06-14', weightKg: '82.10' });
        expect(await repo.listWeightEntries(userId, '2026-06-08', '2026-06-14')).toHaveLength(1);
    });

    it('saves an explicit historical date', async () => {
        const handler = new SaveWeightEntryCommandHandler(repo);

        const saved = await handler.handle(
            new SaveWeightEntryCommand({ date: '2026-06-12', weightKg: '83.00' }),
            identity,
        );

        expect(saved).toMatchObject({ date: '2026-06-12', weightKg: '83.00' });
    });

    it('rejects unauthenticated access', async () => {
        const handler = new SaveWeightEntryCommandHandler(repo);

        await expect(handler.handle(new SaveWeightEntryCommand({ weightKg: '82.40' }), anonymous))
            .rejects.toMatchObject({ statusCode: 401 });
    });
});
