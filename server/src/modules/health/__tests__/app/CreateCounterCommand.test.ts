import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { CreateCounterCommand, CreateCounterCommandHandler } from '../../app/CreateCounterCommand';
import { identity, setupHealthCQBusTest, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('CreateCounterCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates a counter and returns its overview row', async () => {
        const row = await new CreateCounterCommandHandler(ctx.counters, ctx.eventBus)
            .handle(new CreateCounterCommand({ name: 'Sin fumar', startedAt: '2026-06-02', dailyCost: '1000.00' }), identity);

        expect(row).toMatchObject({ name: 'Sin fumar', currentDays: 10, moneyNotSpent: '10000.00' });
    });
});
