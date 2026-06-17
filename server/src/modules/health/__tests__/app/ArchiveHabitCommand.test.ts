import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { ArchiveHabitCommand, ArchiveHabitCommandHandler } from '../../app/ArchiveHabitCommand';
import { identity, makeHabit, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('ArchiveHabitCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('archives the habit for the authenticated user', async () => {
        const habit = makeHabit();
        ctx.habits.seedHabit(userId, habit);

        const archived = await new ArchiveHabitCommandHandler(ctx.habits)
            .handle(new ArchiveHabitCommand(habit.id), identity);

        expect(archived.archivedAt).toBeInstanceOf(Date);
    });
});
