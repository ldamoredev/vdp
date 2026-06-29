import { beforeEach, describe, expect, it } from 'vitest';

import { testDb } from '../../../../test/test-database';
import { ALL_TEST_USERS } from '../../../../test/testUsers';
import { DrizzleObjectiveRepository } from '../../infrastructure/db/DrizzleObjectiveRepository';

const repo = new DrizzleObjectiveRepository(testDb as any);
const userId = '00000000-0000-0000-0000-000000000001';
const otherUserId = '00000000-0000-0000-0000-000000000002';

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

describe('DrizzleObjectiveRepository', () => {
    it('creates and reads an objective scoped to the owner', async () => {
        const objective = await repo.createObjective(userId, {
            title: '120 horas estratégicas',
            periodStart: '2026-07-01',
            periodEnd: '2026-09-30',
            metricSource: 'projects_hours',
            target: 120,
            unit: 'h',
        });

        const ownerView = await repo.getObjective(userId, objective.id);
        const otherView = await repo.getObjective(otherUserId, objective.id);

        expect(ownerView).toMatchObject({
            id: objective.id,
            ownerUserId: userId,
            title: '120 horas estratégicas',
            metricSource: 'projects_hours',
            target: 120,
            manualValue: null,
            currency: null,
            status: 'active',
        });
        expect(otherView).toBeNull();
    });

    it('persists wallet savings currency', async () => {
        const objective = await repo.createObjective(userId, {
            title: 'Ahorro en USD',
            periodStart: '2026-07-01',
            periodEnd: '2026-09-30',
            metricSource: 'wallet_savings',
            target: 1500,
            unit: 'USD',
            currency: 'USD',
        });

        const saved = await repo.getObjective(userId, objective.id);

        expect(saved).toMatchObject({
            metricSource: 'wallet_savings',
            manualValue: null,
            currency: 'USD',
        });
    });

    it('lists objectives for one owner only', async () => {
        await repo.createObjective(userId, {
            title: 'Owner objective',
            periodStart: '2026-01-01',
            periodEnd: '2026-12-31',
            metricSource: 'manual',
            target: 12,
            unit: 'libros',
            manualValue: 2,
        });
        await repo.createObjective(otherUserId, {
            title: 'Other objective',
            periodStart: '2026-01-01',
            periodEnd: '2026-12-31',
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
        });

        const objectives = await repo.listObjectives(userId);

        expect(objectives).toHaveLength(1);
        expect(objectives[0].title).toBe('Owner objective');
    });

    it('saves manual progress and lifecycle state', async () => {
        const objective = await repo.createObjective(userId, {
            title: 'Manual score',
            periodStart: '2026-01-01',
            periodEnd: '2026-12-31',
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
            manualValue: 1,
        });

        objective.update({ manualValue: 6 });
        objective.archive();
        await repo.save(userId, objective);

        const saved = await repo.getObjective(userId, objective.id);
        expect(saved).toMatchObject({
            manualValue: 6,
            status: 'archived',
        });
        expect(saved?.archivedAt).toBeInstanceOf(Date);
    });
});
