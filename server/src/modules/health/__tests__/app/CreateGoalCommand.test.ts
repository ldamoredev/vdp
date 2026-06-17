import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { CreateGoalCommand, CreateGoalCommandHandler } from '../../app/CreateGoalCommand';
import { identity, setupHealthCQBusTest, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('CreateGoalCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates a goal and returns its overview row', async () => {
        const row = await new CreateGoalCommandHandler(ctx.goals, ctx.eventBus)
            .handle(new CreateGoalCommand({ title: 'Empezar el gym', targetDate: '2026-06-30' }), identity);

        expect(row).toMatchObject({ title: 'Empezar el gym', daysLeft: 18, status: 'active' });
    });
});
