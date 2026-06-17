import { Identity } from '@nbottarini/cqbus';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { Habit } from '../../domain/Habit';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';
import { GetHabitsOverviewQuery, GetHabitsOverviewQueryHandler } from '../../app/GetHabitsOverviewQuery';

const userId = 'user-1';
const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

describe('get habits', () => {
    let repo: FakeHabitRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 11, 12, 0, 0));
        repo = new FakeHabitRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('for the authenticated user', async () => {
        const ownHabit = new Habit(randomUUID(), 'Leer', null, null, new Date(), new Date());
        const otherHabit = new Habit(randomUUID(), 'Ajeno', null, null, new Date(), new Date());
        repo.seedHabit(userId, ownHabit);
        repo.seedHabit('someone-else', otherHabit);
        repo.seedCompletions(ownHabit.id, ['2026-06-11']);
        const handler = new GetHabitsOverviewQueryHandler(repo);

        const overview = await handler.handle(new GetHabitsOverviewQuery(), identity);

        expect(overview).toMatchObject({
            date: '2026-06-11',
            habits: [
                {
                    id: ownHabit.id,
                    name: 'Leer',
                    completedToday: true,
                },
            ],
        });
    });

    it('rejects unauthenticated access', async () => {
        const getHandler = new GetHabitsOverviewQueryHandler(repo);

        await expect(getHandler.handle(new GetHabitsOverviewQuery(), anonymous)).rejects.toMatchObject({ statusCode: 401 });
    });
});
