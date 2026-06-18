import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetInvestmentsQuery, GetInvestmentsQueryHandler } from '../../app/GetInvestmentsQuery';
import { identity, makeInvestment, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetInvestmentsQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('lists investments', async () => {
        ctx.investments.seed([makeInvestment({ id: 'inv-1', name: 'FCI' })]);

        const investments = await new GetInvestmentsQueryHandler(ctx.investments)
            .handle(new GetInvestmentsQuery(), identity);

        expect(investments).toEqual([expect.objectContaining({ name: 'FCI' })]);
    });
});
