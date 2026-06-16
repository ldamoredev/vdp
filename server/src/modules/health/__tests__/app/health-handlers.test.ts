import { Identity } from '@nbottarini/cqbus';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { Habit } from '../../domain/Habit';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';
import { CreateHabitCommand, CreateHabitCommandHandler } from '../../app/CreateHabitCommand';
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

describe('health CQBus handlers', () => {
    let repo: FakeHabitRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 11, 12, 0, 0));
        repo = new FakeHabitRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('gets habits for the authenticated user', async () => {
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

    it('creates a habit for the authenticated user and returns its overview row', async () => {
        const handler = new CreateHabitCommandHandler(repo);

        const row = await handler.handle(new CreateHabitCommand({ name: 'Meditar', emoji: '🧘' }), identity);

        expect(row).toMatchObject({
            name: 'Meditar',
            emoji: '🧘',
            completedToday: false,
            streak: 0,
            totalCompletions: 0,
        });
        await expect(repo.listHabits(userId)).resolves.toHaveLength(1);
        await expect(repo.listHabits('someone-else')).resolves.toHaveLength(0);
    });

    it('creates weekly habits with target cadence through the CQBus handler', async () => {
        const handler = new CreateHabitCommandHandler(repo);

        const row = await handler.handle(
            new CreateHabitCommand({ name: 'Gimnasio', cadence: 'weekly', weeklyTarget: 3 }),
            identity,
        );

        expect(row).toMatchObject({
            name: 'Gimnasio',
            cadence: 'weekly',
            weeklyTarget: 3,
            periodCompletions: 0,
            periodTarget: 3,
        });
    });

    it('rejects unauthenticated access', async () => {
        const getHandler = new GetHabitsOverviewQueryHandler(repo);
        const createHandler = new CreateHabitCommandHandler(repo);

        await expect(getHandler.handle(new GetHabitsOverviewQuery(), anonymous)).rejects.toMatchObject({ statusCode: 401 });
        await expect(createHandler.handle(new CreateHabitCommand({ name: 'Leer' }), anonymous)).rejects.toMatchObject({
            statusCode: 401,
        });
    });
});
