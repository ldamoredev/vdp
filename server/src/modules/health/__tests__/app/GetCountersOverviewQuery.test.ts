import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { GetCountersOverviewQuery, GetCountersOverviewQueryHandler } from '../../app/GetCountersOverviewQuery';
import { identity, makeCounter, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('GetCountersOverviewQuery', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns counters and keeps lazy milestone detection on overview load', async () => {
        ctx.counters.seedCounter(userId, makeCounter('2026-06-05'));

        const overview = await new GetCountersOverviewQueryHandler(ctx.counters, ctx.eventBus)
            .handle(new GetCountersOverviewQuery(), identity);

        expect(overview.counters).toHaveLength(1);
        expect(ctx.emitted).toHaveLength(1);
        expect(ctx.emitted[0].payload).toMatchObject({ counterName: 'Sin fumar', days: 7 });
    });
});
