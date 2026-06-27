import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ALL_TEST_USERS, PRIMARY_TEST_USER, SECONDARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';
import { TestDatabase } from '../../../../test/test-database';
import { TestApp } from './TestApp';

const testDb = new TestDatabase();
const testApp = new TestApp();

beforeAll(async () => {
    await testDb.setup();
    await testApp.setup();
}, 30_000);

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

afterAll(async () => {
    await testApp.teardown();
});

function asUser(userId: string) {
    return { [TEST_USER_ID_HEADER]: userId };
}

async function createProjectAs(userId: string, overrides: Record<string, unknown> = {}) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: asUser(userId),
        payload: {
            kind: 'work',
            outcome: 'Ship D3a',
            nextAction: 'Wire board',
            focus: 'Projects',
            ...overrides,
        },
    });
    return response.json();
}

async function createClientAs(userId: string, name = 'Acme') {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/projects/clients',
        headers: asUser(userId),
        payload: { name },
    });
    return response.json();
}

async function createTaskAs(userId: string, title: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/tasks',
        headers: asUser(userId),
        payload: { title },
    });
    return response.json().task ?? response.json();
}

async function logTimeAs(userId: string, projectId: string, overrides: Record<string, unknown> = {}) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/projects/time-entries',
        headers: asUser(userId),
        payload: { projectId, date: '2026-06-18', minutes: 60, ...overrides },
    });
    return response.json();
}

describe('Projects API — E2E', () => {
    it('creates, lists, reads and archives a project', async () => {
        const createdResponse = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/projects',
            payload: {
                kind: 'personal',
                outcome: 'Move home',
                nextAction: 'Call movers',
                focus: 'Logistics',
            },
        });
        const created = createdResponse.json();

        const listResponse = await testApp.app.inject({ method: 'GET', url: '/api/v1/projects' });
        const readResponse = await testApp.app.inject({ method: 'GET', url: `/api/v1/projects/${created.id}` });
        const archiveResponse = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/projects/${created.id}/archive`,
        });

        expect(createdResponse.statusCode).toBe(201);
        expect(listResponse.json().projects).toHaveLength(1);
        expect(readResponse.json()).toMatchObject({ id: created.id, outcome: 'Move home' });
        expect(archiveResponse.json()).toMatchObject({ id: created.id, status: 'archived' });
    });

    it('assigns and unassigns an existing task to the project board', async () => {
        const project = await createProjectAs(PRIMARY_TEST_USER.id);
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Build board presenter');

        const assigned = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/projects/${project.id}/tasks`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { taskId: task.id, boardStatus: 'doing' },
        });
        const filtered = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/tasks?projectId=${project.id}&boardStatus=doing`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        const unassigned = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/projects/${project.id}/tasks`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { taskId: task.id, boardStatus: null },
        });

        expect(assigned.json()).toMatchObject({ id: task.id, projectId: project.id, boardStatus: 'doing' });
        expect(filtered.json().tasks).toHaveLength(1);
        expect(unassigned.json()).toMatchObject({ id: task.id, projectId: null, boardStatus: 'backlog' });
    });

    it('creates a task assigned to an owned project from the tasks API', async () => {
        const project = await createProjectAs(PRIMARY_TEST_USER.id);

        const response = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/tasks',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { title: 'Wire selector', projectId: project.id },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json().task).toMatchObject({
            title: 'Wire selector',
            projectId: project.id,
            boardStatus: 'backlog',
        });
    });

    it('updates a task project assignment from the tasks API', async () => {
        const project = await createProjectAs(PRIMARY_TEST_USER.id);
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Move into project');

        const assigned = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/tasks/${task.id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { projectId: project.id },
        });
        const unassigned = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/tasks/${task.id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { projectId: null },
        });

        expect(assigned.statusCode).toBe(200);
        expect(assigned.json()).toMatchObject({ id: task.id, projectId: project.id, boardStatus: 'backlog' });
        expect(unassigned.json()).toMatchObject({ id: task.id, projectId: null, boardStatus: 'backlog' });
    });

    it('does not let a user create or update tasks against another users project', async () => {
        const otherProject = await createProjectAs(SECONDARY_TEST_USER.id);
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const createResponse = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/tasks',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { title: 'Cross-user project', projectId: otherProject.id },
        });
        const updateResponse = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/tasks/${task.id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { projectId: otherProject.id },
        });

        expect(createResponse.statusCode).toBe(404);
        expect(createResponse.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Project not found' });
        expect(updateResponse.statusCode).toBe(404);
        expect(updateResponse.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Project not found' });
    });

    it('does not expose projects across users', async () => {
        const project = await createProjectAs(PRIMARY_TEST_USER.id);

        const read = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/projects/${project.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        const list = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/projects',
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(read.statusCode).toBe(404);
        expect(list.json().projects).toHaveLength(0);
    });

    it('does not let a user assign another users task to their project', async () => {
        const project = await createProjectAs(PRIMARY_TEST_USER.id);
        const otherTask = await createTaskAs(SECONDARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/projects/${project.id}/tasks`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { taskId: otherTask.id, boardStatus: 'next' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Task not found' });
    });

    it('does not let a user assign a task through another users project', async () => {
        const otherProject = await createProjectAs(SECONDARY_TEST_USER.id);
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private direction');

        const response = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/projects/${otherProject.id}/tasks`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { taskId: task.id, boardStatus: 'next' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Project not found' });
    });

    it('manages clients and logs project hours', async () => {
        const client = await createClientAs(PRIMARY_TEST_USER.id);
        const project = await createProjectAs(PRIMARY_TEST_USER.id, { clientId: client.id });
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Log implementation time');
        await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/projects/${project.id}/tasks`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { taskId: task.id, boardStatus: 'doing' },
        });

        const logged = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/projects/time-entries',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {
                projectId: project.id,
                taskId: task.id,
                date: '2026-06-18',
                minutes: 90,
                note: 'Backend wiring',
            },
        });
        const report = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/projects/hours-report?fromDate=2026-06-15&toDate=2026-06-21',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        const entries = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/projects/time-entries?projectId=${project.id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });

        expect(logged.statusCode).toBe(201);
        expect(logged.json()).toMatchObject({ projectId: project.id, taskId: task.id, minutes: 90 });
        expect(entries.json().entries).toHaveLength(1);
        expect(report.json()).toMatchObject({
            totalMinutes: 90,
            rows: [{
                clientId: client.id,
                clientName: 'Acme',
                projectId: project.id,
                projectOutcome: 'Ship D3a',
                weekStart: '2026-06-15',
                minutes: 90,
            }],
        });
    });

    it('does not let a user log time against another users project', async () => {
        const otherProject = await createProjectAs(SECONDARY_TEST_USER.id);

        const response = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/projects/time-entries',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {
                projectId: otherProject.id,
                date: '2026-06-18',
                minutes: 30,
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Project not found' });
    });

    it('does not expose clients across users', async () => {
        await createClientAs(PRIMARY_TEST_USER.id, 'Acme');

        const list = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/projects/clients',
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(list.json().clients).toEqual([]);
    });

    it('does not let a user update or archive another users client', async () => {
        const client = await createClientAs(PRIMARY_TEST_USER.id, 'Acme');

        const update = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/projects/clients/${client.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: { name: 'Hijacked' },
        });
        const archive = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/projects/clients/${client.id}/archive`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(update.statusCode).toBe(404);
        expect(archive.statusCode).toBe(404);
    });

    it('does not expose or mutate another users time entries', async () => {
        const project = await createProjectAs(PRIMARY_TEST_USER.id);
        const entry = await logTimeAs(PRIMARY_TEST_USER.id, project.id, { minutes: 45 });

        const list = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/projects/time-entries',
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        const update = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/projects/time-entries/${entry.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: { minutes: 120 },
        });
        const remove = await testApp.app.inject({
            method: 'DELETE',
            url: `/api/v1/projects/time-entries/${entry.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(list.json().entries).toEqual([]);
        expect(update.statusCode).toBe(404);
        expect(remove.json()).toEqual({ deleted: false });

        // The owner's entry survived the cross-user attempts.
        const ownerEntries = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/projects/time-entries',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(ownerEntries.json().entries).toHaveLength(1);
        expect(ownerEntries.json().entries[0]).toMatchObject({ id: entry.id, minutes: 45 });
    });

    it('scopes the hours report to the requesting user', async () => {
        const project = await createProjectAs(PRIMARY_TEST_USER.id);
        await logTimeAs(PRIMARY_TEST_USER.id, project.id, { minutes: 90 });

        const report = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/projects/hours-report?fromDate=2026-06-15&toDate=2026-06-21',
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(report.json()).toMatchObject({ totalMinutes: 0, rows: [] });
    });
});
