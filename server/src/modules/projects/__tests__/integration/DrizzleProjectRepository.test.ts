import { beforeEach, describe, expect, it } from 'vitest';

import { testDb } from '../../../../test/test-database';
import { ALL_TEST_USERS } from '../../../../test/testUsers';
import { DrizzleProjectRepository } from '../../infrastructure/db/DrizzleProjectRepository';

const repo = new DrizzleProjectRepository(testDb as any);
const userId = '00000000-0000-0000-0000-000000000001';
const otherUserId = '00000000-0000-0000-0000-000000000002';

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

describe('DrizzleProjectRepository', () => {
    it('creates and reads a project scoped to the owner', async () => {
        const project = await repo.createProject(userId, {
            kind: 'work',
            outcome: 'Report hours',
            nextAction: 'Create first project',
            focus: 'D3a',
            client: 'Acme',
            hourlyRate: '150.00',
            rateCurrency: 'USD',
        });

        const ownerView = await repo.getProject(userId, project.id);
        const otherView = await repo.getProject(otherUserId, project.id);

        expect(ownerView).toMatchObject({
            id: project.id,
            kind: 'work',
            client: 'Acme',
            hourlyRate: '150.00',
            rateCurrency: 'USD',
            status: 'active',
        });
        expect(otherView).toBeNull();
    });

    it('lists projects for one owner only', async () => {
        await repo.createProject(userId, {
            kind: 'personal',
            outcome: 'Move house',
            nextAction: 'Call movers',
            focus: 'Logistics',
        });
        await repo.createProject(otherUserId, {
            kind: 'work',
            outcome: 'Other owner',
            nextAction: 'Private',
            focus: 'Isolation',
        });

        const projects = await repo.listProjects(userId);

        expect(projects).toHaveLength(1);
        expect(projects[0].outcome).toBe('Move house');
    });

    it('saves archived lifecycle state', async () => {
        const project = await repo.createProject(userId, {
            kind: 'work',
            outcome: 'Ship board',
            nextAction: 'Archive it',
            focus: 'Lifecycle',
        });

        project.archive();
        await repo.save(userId, project);

        const saved = await repo.getProject(userId, project.id);
        expect(saved?.status).toBe('archived');
        expect(saved?.archivedAt).toBeInstanceOf(Date);
    });

    it('saves hourly rate changes', async () => {
        const project = await repo.createProject(userId, {
            kind: 'work',
            outcome: 'Billable work',
            nextAction: 'Set rate',
            focus: 'Revenue',
        });

        project.updateDirection({ hourlyRate: '42000.00', rateCurrency: 'ARS' });
        await repo.save(userId, project);

        const saved = await repo.getProject(userId, project.id);
        expect(saved).toMatchObject({
            hourlyRate: '42000.00',
            rateCurrency: 'ARS',
        });
    });
});
