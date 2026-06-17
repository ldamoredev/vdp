import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { UncompleteHabitDayCommand, UncompleteHabitDayCommandHandler } from '../../app/UncompleteHabitDayCommand';
import { identity, makeHabit, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('UncompleteHabitDayCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('removes the habit completion for the authenticated user', async () => {
        const habit = makeHabit();
        ctx.habits.seedHabit(userId, habit);
        await ctx.habits.logCompletion(userId, habit.id, '2026-06-12');

        const result = await new UncompleteHabitDayCommandHandler(ctx.habits)
            .handle(new UncompleteHabitDayCommand(habit.id), identity);

        expect(result).toEqual({ removed: true });
    });
});
