import { beforeEach, describe, expect, it } from 'vitest';

import { testDb } from '../../../../test/test-database';
import { ALL_TEST_USERS } from '../../../../test/testUsers';
import { DrizzleInboxItemRepository } from '../../infrastructure/db/DrizzleInboxItemRepository';

const repo = new DrizzleInboxItemRepository(testDb as any);
const userId = '00000000-0000-0000-0000-000000000001';
const otherUserId = '00000000-0000-0000-0000-000000000002';

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

describe('DrizzleInboxItemRepository', () => {
    it('captures and reads an item scoped to the owner', async () => {
        const item = await repo.captureItem(userId, { text: 'Comprar entradas' });

        const ownerView = await repo.getItem(userId, item.id);
        const otherView = await repo.getItem(otherUserId, item.id);

        expect(ownerView).toMatchObject({
            id: item.id,
            ownerUserId: userId,
            text: 'Comprar entradas',
            status: 'pending',
            routedTo: null,
        });
        expect(otherView).toBeNull();
    });

    it('persists a discard', async () => {
        const item = await repo.captureItem(userId, { text: 'Algo', note: 'con nota' });
        item.discard();
        await repo.save(userId, item);

        const saved = await repo.getItem(userId, item.id);

        expect(saved).toMatchObject({ status: 'discarded', note: 'con nota' });
    });

    it('lists items for one owner only, newest first', async () => {
        const first = await repo.captureItem(userId, { text: 'uno' });
        const second = await repo.captureItem(userId, { text: 'dos' });
        await repo.captureItem(otherUserId, { text: 'ajeno' });

        const list = await repo.listItems(userId);

        expect(list.map((i) => i.id)).toEqual([second.id, first.id]);
    });
});
