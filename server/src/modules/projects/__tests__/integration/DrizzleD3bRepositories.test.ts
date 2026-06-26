import { beforeEach, describe, expect, it } from 'vitest';

import { testDb } from '../../../../test/test-database';
import { ALL_TEST_USERS } from '../../../../test/testUsers';
import { DrizzleClientRepository } from '../../infrastructure/db/DrizzleClientRepository';
import { DrizzleProjectRepository } from '../../infrastructure/db/DrizzleProjectRepository';
import { DrizzleTimeEntryRepository } from '../../infrastructure/db/DrizzleTimeEntryRepository';

const clients = new DrizzleClientRepository(testDb as any);
const projects = new DrizzleProjectRepository(testDb as any);
const entries = new DrizzleTimeEntryRepository(testDb as any);
const userId = '00000000-0000-0000-0000-000000000001';
const otherUserId = '00000000-0000-0000-0000-000000000002';

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

describe('Drizzle D3b repositories', () => {
    it('creates clients and project time entries scoped to the owner', async () => {
        const client = await clients.createClient(userId, { name: 'Acme' });
        const project = await projects.createProject(userId, {
            kind: 'work',
            outcome: 'Report hours',
            nextAction: 'Log time',
            focus: 'D3b',
            clientId: client.id,
        });

        const entry = await entries.createTimeEntry(userId, {
            projectId: project.id,
            taskId: null,
            date: '2026-06-18',
            minutes: 45,
            note: 'Planning',
        });
        const ownerEntries = await entries.listTimeEntries(userId, {
            fromDate: '2026-06-01',
            toDate: '2026-06-30',
        });
        const otherEntries = await entries.listTimeEntries(otherUserId, {
            fromDate: '2026-06-01',
            toDate: '2026-06-30',
        });

        expect(project.clientId).toBe(client.id);
        expect(entry.minutes).toBe(45);
        expect(ownerEntries).toHaveLength(1);
        expect(otherEntries).toHaveLength(0);
    });
});
