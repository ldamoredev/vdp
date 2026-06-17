import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { CompleteHabitDayCommand, CompleteHabitDayCommandHandler } from '../../app/CompleteHabitDayCommand';
import { identity, makeHabit, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('CompleteHabitDayCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('logs the habit completion for the authenticated user', async () => {
        const habit = makeHabit();
        ctx.habits.seedHabit(userId, habit);

        const result = await new CompleteHabitDayCommandHandler(ctx.habits, ctx.eventBus)
            .handle(new CompleteHabitDayCommand(habit.id), identity);

        expect(result).toEqual({ logged: true });
    });
});
