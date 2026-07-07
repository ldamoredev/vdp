import pg from 'pg';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { TEST_DATABASE_CONNECTION_STRING, testDb } from '../../../../test/test-database';
import { ALL_TEST_USERS, PRIMARY_TEST_USER, SECONDARY_TEST_USER } from '../../../../test/testUsers';
import { DrizzleUsageEventRepository } from '../../infrastructure/usage/DrizzleUsageEventRepository';

const pool = new pg.Pool({ connectionString: TEST_DATABASE_CONNECTION_STRING });
const repo = new DrizzleUsageEventRepository(testDb as any);
const ownerId = PRIMARY_TEST_USER.id;
const otherId = SECONDARY_TEST_USER.id;

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

afterAll(async () => {
    await pool.end();
});

async function allRows() {
    const result = await pool.query(
        `SELECT owner_user_id, surface, action, occurred_on::text, count
         FROM core.usage_events ORDER BY owner_user_id, surface, action, occurred_on`,
    );
    return result.rows;
}

describe('DrizzleUsageEventRepository', () => {
    it('records a first event with count 1', async () => {
        await repo.record({ ownerUserId: ownerId, surface: 'tasks', action: 'GET /tasks', occurredOn: '2026-07-07' });

        expect(await allRows()).toEqual([
            { owner_user_id: ownerId, surface: 'tasks', action: 'GET /tasks', occurred_on: '2026-07-07', count: 1 },
        ]);
    });

    it('increments the counter for repeats of the same key on the same day', async () => {
        const event = { ownerUserId: ownerId, surface: 'tasks', action: 'GET /tasks', occurredOn: '2026-07-07' };

        await repo.record(event);
        await repo.record(event);
        await repo.record(event);

        const rows = await allRows();
        expect(rows).toHaveLength(1);
        expect(rows[0].count).toBe(3);
    });

    it('keeps separate rows per action and per day', async () => {
        await repo.record({ ownerUserId: ownerId, surface: 'tasks', action: 'GET /tasks', occurredOn: '2026-07-07' });
        await repo.record({ ownerUserId: ownerId, surface: 'tasks', action: 'POST /tasks', occurredOn: '2026-07-07' });
        await repo.record({ ownerUserId: ownerId, surface: 'tasks', action: 'GET /tasks', occurredOn: '2026-07-08' });

        const rows = await allRows();
        expect(rows).toHaveLength(3);
        expect(rows.every((r) => r.count === 1)).toBe(true);
    });

    it('keeps counters isolated between users sharing the same key', async () => {
        const key = { surface: 'wallet', action: 'GET /wallet/summary', occurredOn: '2026-07-07' };

        await repo.record({ ownerUserId: ownerId, ...key });
        await repo.record({ ownerUserId: ownerId, ...key });
        await repo.record({ ownerUserId: otherId, ...key });

        const rows = await allRows();
        expect(rows).toHaveLength(2);
        expect(rows.find((r) => r.owner_user_id === ownerId)?.count).toBe(2);
        expect(rows.find((r) => r.owner_user_id === otherId)?.count).toBe(1);
    });
});
