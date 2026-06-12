import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { Habit } from '../../domain/Habit';
import { CompleteHabitDay } from '../../services/CompleteHabitDay';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';

const userId = 'user-1';
const TODAY = '2026-06-11';

function makeHabit(name = 'Gimnasio'): Habit {
    return new Habit(randomUUID(), name, null, null, new Date(), new Date());
}

describe('CompleteHabitDay', () => {
    let repo: FakeHabitRepository;
    let eventBus: EventBus;
    let service: CompleteHabitDay;
    let emitted: DomainEvent[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 11, 12, 0, 0));
        repo = new FakeHabitRepository();
        eventBus = new EventBus();
        service = new CompleteHabitDay(repo, eventBus);
        emitted = [];
        eventBus.on('health.habit.streak_broken', (e) => { emitted.push(e); });
        eventBus.on('health.habit.milestone', (e) => { emitted.push(e); });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('logs today and is idempotent', async () => {
        const habit = makeHabit();
        repo.seedHabit(userId, habit);

        await expect(service.execute(userId, habit.id)).resolves.toEqual({ logged: true });
        await expect(service.execute(userId, habit.id)).resolves.toEqual({ logged: false });
        await expect(repo.getCompletionDates(userId, habit.id)).resolves.toEqual([TODAY]);
    });

    it('rejects future dates and archived habits', async () => {
        const habit = makeHabit();
        repo.seedHabit(userId, habit);

        await expect(service.execute(userId, habit.id, '2026-06-12')).rejects.toMatchObject({ statusCode: 422 });

        habit.archive();
        await expect(service.execute(userId, habit.id)).rejects.toMatchObject({ statusCode: 422 });
    });

    it('404s for another user\'s habit', async () => {
        const habit = makeHabit();
        repo.seedHabit('someone-else', habit);

        await expect(service.execute(userId, habit.id)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('emits streak_broken when resuming after a gap that killed a streak >= 3', async () => {
        const habit = makeHabit('Leer');
        repo.seedHabit(userId, habit);
        repo.seedCompletions(habit.id, ['2026-06-08', '2026-06-07', '2026-06-06', '2026-06-05']);

        await service.execute(userId, habit.id);

        const broken = emitted.find((e) => e.type === 'habit.streak_broken');
        expect(broken).toBeDefined();
        expect(broken!.payload).toMatchObject({
            userId,
            habitName: 'Leer',
            lostStreak: 4,
            lastCompletedDate: '2026-06-08',
            resumedDate: TODAY,
        });
    });

    it('stays silent when the gap killed a streak below 3', async () => {
        const habit = makeHabit();
        repo.seedHabit(userId, habit);
        repo.seedCompletions(habit.id, ['2026-06-08', '2026-06-07']);

        await service.execute(userId, habit.id);

        expect(emitted.filter((e) => e.type === 'habit.streak_broken')).toHaveLength(0);
    });

    it('emits a milestone when the streak reaches 7', async () => {
        const habit = makeHabit('Meditar');
        repo.seedHabit(userId, habit);
        repo.seedCompletions(habit.id, [
            '2026-06-10', '2026-06-09', '2026-06-08',
            '2026-06-07', '2026-06-06', '2026-06-05',
        ]);

        await service.execute(userId, habit.id);

        const milestone = emitted.find((e) => e.type === 'habit.milestone');
        expect(milestone).toBeDefined();
        expect(milestone!.payload).toMatchObject({ habitName: 'Meditar', streak: 7 });
    });

    it('does not emit signals for backfilled (non-today) dates', async () => {
        const habit = makeHabit();
        repo.seedHabit(userId, habit);
        repo.seedCompletions(habit.id, ['2026-06-05', '2026-06-04', '2026-06-03']);

        await service.execute(userId, habit.id, '2026-06-09');

        expect(emitted).toHaveLength(0);
    });
});
