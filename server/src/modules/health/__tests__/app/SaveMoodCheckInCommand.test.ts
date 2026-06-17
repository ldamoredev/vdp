import { Identity } from '@nbottarini/cqbus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { FakeMoodCheckInRepository } from '../fakes/FakeMoodCheckInRepository';
import { SaveMoodCheckInCommand, SaveMoodCheckInCommandHandler } from '../../app/SaveMoodCheckInCommand';

const userId = 'user-1';
const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

describe('save mood check-in', () => {
    let repo: FakeMoodCheckInRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 14, 12, 0, 0));
        repo = new FakeMoodCheckInRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('upserts today for the authenticated user', async () => {
        const handler = new SaveMoodCheckInCommandHandler(repo);

        const saved = await handler.handle(new SaveMoodCheckInCommand({ mood: 2, energy: 4 }), identity);
        const updated = await handler.handle(new SaveMoodCheckInCommand({ mood: 3, energy: 5 }), identity);

        expect(saved).toMatchObject({ date: '2026-06-14', mood: 2, energy: 4 });
        expect(updated).toMatchObject({ date: '2026-06-14', mood: 3, energy: 5 });
        expect(await repo.listMoodCheckIns(userId, '2026-06-08', '2026-06-14')).toHaveLength(1);
    });

    it('saves an explicit historical date', async () => {
        const handler = new SaveMoodCheckInCommandHandler(repo);

        const saved = await handler.handle(
            new SaveMoodCheckInCommand({ date: '2026-06-12', mood: 1, energy: 2 }),
            identity,
        );

        expect(saved).toMatchObject({ date: '2026-06-12', mood: 1, energy: 2 });
    });

    it('rejects unauthenticated access', async () => {
        const handler = new SaveMoodCheckInCommandHandler(repo);

        await expect(handler.handle(new SaveMoodCheckInCommand({ mood: 2, energy: 4 }), anonymous))
            .rejects.toMatchObject({ statusCode: 401 });
    });
});
