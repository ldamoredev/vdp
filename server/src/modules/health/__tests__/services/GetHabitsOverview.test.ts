import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { Habit } from '../../domain/Habit';
import { GetHabitsOverview } from '../../services/GetHabitsOverview';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';

const userId = 'user-1';

describe('GetHabitsOverview', () => {
    let repo: FakeHabitRepository;
    let service: GetHabitsOverview;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 11, 12, 0, 0));
        repo = new FakeHabitRepository();
        service = new GetHabitsOverview(repo);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('builds rows with completion state and streaks', async () => {
        const gym = new Habit(randomUUID(), 'Gimnasio', '🏋️', null, new Date(), new Date());
        repo.seedHabit(userId, gym);
        repo.seedCompletions(gym.id, ['2026-06-11', '2026-06-10', '2026-06-09', '2026-06-05', '2026-06-04']);

        const overview = await service.execute(userId);

        expect(overview.date).toBe('2026-06-11');
        expect(overview.habits).toHaveLength(1);
        expect(overview.habits[0]).toMatchObject({
            name: 'Gimnasio',
            emoji: '🏋️',
            completedToday: true,
            streak: 3,
            bestStreak: 3,
            totalCompletions: 5,
            lastCompletedDate: '2026-06-11',
        });
    });

    it('keeps a streak alive when yesterday was completed but today is pending', async () => {
        const habit = new Habit(randomUUID(), 'Leer', null, null, new Date(), new Date());
        repo.seedHabit(userId, habit);
        repo.seedCompletions(habit.id, ['2026-06-10', '2026-06-09']);

        const overview = await service.execute(userId);

        expect(overview.habits[0]).toMatchObject({ completedToday: false, streak: 2 });
    });

    it('excludes archived habits and other users\' habits', async () => {
        const archived = new Habit(randomUUID(), 'Viejo', null, new Date(), new Date(), new Date());
        const foreign = new Habit(randomUUID(), 'Ajeno', null, null, new Date(), new Date());
        repo.seedHabit(userId, archived);
        repo.seedHabit('someone-else', foreign);

        const overview = await service.execute(userId);

        expect(overview.habits).toHaveLength(0);
    });
});
