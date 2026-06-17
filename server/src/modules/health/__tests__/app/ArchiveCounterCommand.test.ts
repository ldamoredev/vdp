import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { ArchiveCounterCommand, ArchiveCounterCommandHandler } from '../../app/ArchiveCounterCommand';
import { identity, makeCounter, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('ArchiveCounterCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('archives the counter for the authenticated user', async () => {
        const counter = makeCounter();
        ctx.counters.seedCounter(userId, counter);

        const archived = await new ArchiveCounterCommandHandler(ctx.counters)
            .handle(new ArchiveCounterCommand(counter.id), identity);

        expect(archived.archivedAt).toBeInstanceOf(Date);
    });
});
