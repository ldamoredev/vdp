import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';

import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { Habit } from '../../domain/Habit';
import { CreateHabit } from '../../services/CreateHabit';
import { GetHabitsOverview } from '../../services/GetHabitsOverview';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';
import { CreateHabitCommand, CreateHabitCommandHandler } from '../../app/CreateHabitCommand';
import { GetHabitsOverviewQuery, GetHabitsOverviewQueryHandler } from '../../app/GetHabitsOverviewQuery';

const userId = 'user-1';

function authenticated(auth: AuthContextStorage, callback: () => Promise<unknown>): Promise<unknown> {
    return auth.runWithContext({
        isAuthenticated: true,
        userId,
        sessionId: 'session-1',
        role: 'user',
        email: 'test@example.com',
        displayName: 'Test',
    }, callback);
}

describe('health CQBus handlers', () => {
    let repo: FakeHabitRepository;
    let auth: AuthContextStorage;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 11, 12, 0, 0));
        repo = new FakeHabitRepository();
        auth = new AuthContextStorage();
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
        const handler = new GetHabitsOverviewQueryHandler(new GetHabitsOverview(repo), auth);

        const overview = await authenticated(auth, () => handler.handle(new GetHabitsOverviewQuery()));

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
        const handler = new CreateHabitCommandHandler(
            new CreateHabit(repo),


        );

        const row = await authenticated(auth, () =>
            handler.handle(new CreateHabitCommand({ name: 'Meditar', emoji: '🧘' })),
        );

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

    it('rejects unauthenticated access', async () => {
        const getHandler = new GetHabitsOverviewQueryHandler(new GetHabitsOverview(repo), auth);
        const createHandler = new CreateHabitCommandHandler(
            new CreateHabit(repo),


        );

        await expect(getHandler.handle(new GetHabitsOverviewQuery())).rejects.toMatchObject({ statusCode: 401 });
        await expect(createHandler.handle(new CreateHabitCommand({ name: 'Leer' }))).rejects.toMatchObject({
            statusCode: 401,
        });
    });
});
