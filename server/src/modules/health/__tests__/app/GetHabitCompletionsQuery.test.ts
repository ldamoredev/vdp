import { describe, expect, it } from 'vitest';

import { NotFoundHttpError } from '../../../common/http/errors';
import { GetHabitCompletionsQuery, GetHabitCompletionsQueryHandler } from '../../app/GetHabitCompletionsQuery';
import { identity, makeHabit, setupHealthCQBusTest, userId } from './health-cqbus-test-helpers';

describe('GetHabitCompletionsQuery', () => {
    it('counts completions for one owned habit inside the requested period', async () => {
        const ctx = setupHealthCQBusTest();
        const habit = makeHabit('Meditar');
        ctx.habits.seedHabit(userId, habit);
        ctx.habits.seedCompletions(habit.id, [
            '2026-06-01',
            '2026-06-10',
            '2026-06-15',
            '2026-07-01',
        ]);

        const result = await new GetHabitCompletionsQueryHandler(ctx.habits).handle(
            new GetHabitCompletionsQuery(habit.id, '2026-06-01', '2026-06-30'),
            identity,
        );

        expect(result).toEqual({
            habitId: habit.id,
            from: '2026-06-01',
            to: '2026-06-30',
            count: 3,
        });
    });

    it('rejects missing or cross-user habits as not found', async () => {
        const ctx = setupHealthCQBusTest();

        await expect(new GetHabitCompletionsQueryHandler(ctx.habits).handle(
            new GetHabitCompletionsQuery('missing', '2026-06-01', '2026-06-30'),
            identity,
        )).rejects.toBeInstanceOf(NotFoundHttpError);
    });
});
