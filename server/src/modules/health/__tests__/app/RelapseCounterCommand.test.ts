import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { RelapseCounterCommand, RelapseCounterCommandHandler } from '../../app/RelapseCounterCommand';
import { identity, makeCounter, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('RelapseCounterCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('registers a relapse and returns the restarted counter row', async () => {
        const counter = makeCounter('2026-06-02');
        ctx.counters.seedCounter(userId, counter);

        const row = await new RelapseCounterCommandHandler(ctx.counters, ctx.eventBus)
            .handle(new RelapseCounterCommand(counter.id), identity);

        expect(row.currentDays).toBe(0);
        expect(ctx.counters.attemptsFor(counter.id)).toHaveLength(1);
    });
});
