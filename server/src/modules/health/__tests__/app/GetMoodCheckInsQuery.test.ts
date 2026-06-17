import { Identity } from '@nbottarini/cqbus';
import { randomUUID } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { Habit } from '../../domain/Habit';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';
import { FakeMoodCheckInRepository } from '../fakes/FakeMoodCheckInRepository';
import { GetMoodCheckInsQuery, GetMoodCheckInsQueryHandler } from '../../app/GetMoodCheckInsQuery';

const userId = 'user-1';
const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

describe('get mood check-ins', () => {
    let moodRepo: FakeMoodCheckInRepository;
    let habitRepo: FakeHabitRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 14, 12, 0, 0));
        moodRepo = new FakeMoodCheckInRepository();
        habitRepo = new FakeHabitRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the authenticated user window with weekly habit completion summary', async () => {
        await moodRepo.saveMoodCheckIn(userId, { date: '2026-06-14', mood: 2, energy: 3 });
        await moodRepo.saveMoodCheckIn(userId, { date: '2026-06-13', mood: 3, energy: 4 });
        await moodRepo.saveMoodCheckIn('someone-else', { date: '2026-06-14', mood: 5, energy: 5 });
        const habit = new Habit(randomUUID(), 'Leer', null, null, new Date(), new Date());
        habitRepo.seedHabit(userId, habit);
        habitRepo.seedCompletions(habit.id, ['2026-06-14', '2026-06-12', '2026-06-10']);
        const handler = new GetMoodCheckInsQueryHandler(moodRepo, habitRepo);

        const overview = await handler.handle(new GetMoodCheckInsQuery(7), identity);

        expect(overview.date).toBe('2026-06-14');
        expect(overview.checkIns.map((checkIn) => checkIn.date)).toEqual(['2026-06-14', '2026-06-13']);
        expect(overview.summary).toEqual({
            days: 7,
            checkInCount: 2,
            averageMood: 2.5,
            averageEnergy: 3.5,
            habitCompletionRate: 43,
        });
    });

    it('returns null averages and zero habit rate when there is no data', async () => {
        const handler = new GetMoodCheckInsQueryHandler(moodRepo, habitRepo);

        const overview = await handler.handle(new GetMoodCheckInsQuery(7), identity);

        expect(overview.checkIns).toEqual([]);
        expect(overview.summary).toMatchObject({
            averageMood: null,
            averageEnergy: null,
            habitCompletionRate: 0,
        });
    });

    it('rejects unauthenticated access', async () => {
        const handler = new GetMoodCheckInsQueryHandler(moodRepo, habitRepo);

        await expect(handler.handle(new GetMoodCheckInsQuery(), anonymous)).rejects.toMatchObject({ statusCode: 401 });
    });
});
