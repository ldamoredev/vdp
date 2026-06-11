import { beforeEach, describe, expect, it } from 'vitest';
import { DrizzleTaskInsightRepository } from '../../infrastructure/db/DrizzleTaskInsightRepository';
import { testDb } from '../../../../test/test-database';
import { ALL_TEST_USERS } from '../../../../test/testUsers';

const DEFAULT_TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const SECONDARY_TEST_USER_ID = '00000000-0000-0000-0000-000000000002';

const repo = new DrizzleTaskInsightRepository(testDb as never);

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

function insight(id: string, createdAt: string, overrides: Partial<{ userId: string; read: boolean }> = {}) {
    return {
        id,
        userId: overrides.userId ?? DEFAULT_TEST_USER_ID,
        type: 'warning',
        title: 'Gasto elevado esta semana',
        message: 'Subió 80% respecto al promedio',
        metadata: { source: 'wallet.spending.spike', percentageIncrease: 80 },
        read: overrides.read ?? false,
        createdAt: new Date(createdAt),
    };
}

describe('DrizzleTaskInsightRepository', () => {
    it('roundtrips insert and listAll oldest-first with metadata intact', async () => {
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb02', '2026-06-02T10:00:00Z'));
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb01', '2026-06-01T10:00:00Z'));

        const all = await repo.listAll();
        expect(all.map((row) => row.id)).toEqual([
            '00000000-0000-0000-0000-00000000bb01',
            '00000000-0000-0000-0000-00000000bb02',
        ]);
        expect(all[0].metadata).toEqual({ source: 'wallet.spending.spike', percentageIncrease: 80 });
        expect(all[0].read).toBe(false);
        expect(all[0].userId).toBe(DEFAULT_TEST_USER_ID);
    });

    it('marks read per insight and per user', async () => {
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb01', '2026-06-01T10:00:00Z'));
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb02', '2026-06-02T10:00:00Z'));
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb03', '2026-06-03T10:00:00Z', {
            userId: SECONDARY_TEST_USER_ID,
        }));

        // markRead scoped to owner: another user's id must not flip the row
        await repo.markRead(SECONDARY_TEST_USER_ID, '00000000-0000-0000-0000-00000000bb01');
        let all = await repo.listAll();
        expect(all.find((row) => row.id === '00000000-0000-0000-0000-00000000bb01')?.read).toBe(false);

        await repo.markRead(DEFAULT_TEST_USER_ID, '00000000-0000-0000-0000-00000000bb01');
        await repo.markAllRead(DEFAULT_TEST_USER_ID);

        all = await repo.listAll();
        expect(all.find((row) => row.id === '00000000-0000-0000-0000-00000000bb01')?.read).toBe(true);
        expect(all.find((row) => row.id === '00000000-0000-0000-0000-00000000bb02')?.read).toBe(true);
        expect(all.find((row) => row.id === '00000000-0000-0000-0000-00000000bb03')?.read).toBe(false);
    });

    it('trims to the newest N per user without touching other users', async () => {
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb01', '2026-06-01T10:00:00Z'));
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb02', '2026-06-02T10:00:00Z'));
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb03', '2026-06-03T10:00:00Z'));
        await repo.insert(insight('00000000-0000-0000-0000-00000000bb04', '2026-05-01T10:00:00Z', {
            userId: SECONDARY_TEST_USER_ID,
        }));

        await repo.trimToNewest(DEFAULT_TEST_USER_ID, 2);

        const all = await repo.listAll();
        expect(all.map((row) => row.id)).toEqual([
            '00000000-0000-0000-0000-00000000bb04',
            '00000000-0000-0000-0000-00000000bb02',
            '00000000-0000-0000-0000-00000000bb03',
        ]);
    });
});
