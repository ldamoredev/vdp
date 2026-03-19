import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TestApp } from './TestApp';
import { TestDatabase } from '../integration/test-database';

const testDb = new TestDatabase();
const testApp = new TestApp();

beforeAll(async () => {
    await testDb.setup();
    await testApp.setup();
}, 30_000);

beforeEach(async () => {
    await testDb.truncate();
});

afterAll(async () => {
    await testApp.teardown();
});

async function createTask(data: Record<string, unknown> = {}) {
    const res = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/tasks',
        payload: { title: 'Test task', ...data },
    });
    return { status: res.statusCode, body: res.json() };
}

describe('Tasks API — E2E', () => {

    // ─── CRUD ──────────────────────────────────────

    describe('POST /api/v1/tasks', () => {
        it('creates a task and returns 201', async () => {
            const { status, body } = await createTask({ title: 'Buy milk', priority: 3 });

            expect(status).toBe(201);
            expect(body.id).toBeDefined();
            expect(body.title).toBe('Buy milk');
            expect(body.priority).toBe(3);
            expect(body.status).toBe('pending');
        });
    });

    describe('GET /api/v1/tasks', () => {
        it('returns task list with pagination', async () => {
            await createTask({ title: 'Task 1' });
            await createTask({ title: 'Task 2' });

            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks' });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.tasks).toHaveLength(2);
            expect(body.total).toBe(2);
        });

        it('filters by status', async () => {
            const { body: task } = await createTask();

            // Complete the task
            await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${task.id}/complete` });

            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks?status=done' });
            const body = res.json();

            expect(body.tasks).toHaveLength(1);
            expect(body.tasks[0].status).toBe('done');
        });
    });

    describe('GET /api/v1/tasks/:id', () => {
        it('returns task with notes', async () => {
            const { body: task } = await createTask();

            const res = await testApp.app.inject({ method: 'GET', url: `/api/v1/tasks/${task.id}` });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.task.title).toBe('Test task');
            expect(body.notes).toEqual([]);
        });

        it('returns 404 for nonexistent id', async () => {
            const res = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/tasks/00000000-0000-0000-0000-000000000000',
            });
            expect(res.statusCode).toBe(404);
        });
    });

    describe('PUT /api/v1/tasks/:id', () => {
        it('updates task fields', async () => {
            const { body: task } = await createTask({ title: 'Old' });

            const res = await testApp.app.inject({
                method: 'PUT',
                url: `/api/v1/tasks/${task.id}`,
                payload: { title: 'New', priority: 1 },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json().title).toBe('New');
            expect(res.json().priority).toBe(1);
        });
    });

    describe('DELETE /api/v1/tasks/:id', () => {
        it('deletes task and returns success message', async () => {
            const { body: task } = await createTask();

            const res = await testApp.app.inject({ method: 'DELETE', url: `/api/v1/tasks/${task.id}` });

            expect(res.statusCode).toBe(200);
            expect(res.json().message).toBe('Task deleted');

            // Verify it's gone
            const getRes = await testApp.app.inject({ method: 'GET', url: `/api/v1/tasks/${task.id}` });
            expect(getRes.statusCode).toBe(404);
        });
    });

    // ─── Status Transitions ────────────────────────

    describe('POST /api/v1/tasks/:id/complete', () => {
        it('marks task as done', async () => {
            const { body: task } = await createTask();

            const res = await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${task.id}/complete` });

            expect(res.statusCode).toBe(200);
            expect(res.json().status).toBe('done');
            expect(res.json().completedAt).toBeDefined();
        });
    });

    describe('POST /api/v1/tasks/:id/carry-over', () => {
        it('carries over task to specified date', async () => {
            const { body: task } = await createTask();

            const res = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/carry-over`,
                payload: { toDate: '2026-03-25' },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json().scheduledDate).toBe('2026-03-25');
            expect(res.json().carryOverCount).toBe(1);
        });
    });

    describe('POST /api/v1/tasks/:id/discard', () => {
        it('discards the task', async () => {
            const { body: task } = await createTask();

            const res = await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${task.id}/discard` });

            expect(res.statusCode).toBe(200);
            expect(res.json().status).toBe('discarded');
        });
    });

    // ─── Notes ─────────────────────────────────────

    describe('POST /api/v1/tasks/:id/notes', () => {
        it('adds a note and returns 201', async () => {
            const { body: task } = await createTask();

            const res = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/notes`,
                payload: { content: 'Important note' },
            });

            expect(res.statusCode).toBe(201);
            expect(res.json().content).toBe('Important note');
        });
    });

    describe('GET /api/v1/tasks/:id/notes', () => {
        it('returns notes for the task', async () => {
            const { body: task } = await createTask();

            await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/notes`,
                payload: { content: 'Note 1' },
            });

            const res = await testApp.app.inject({ method: 'GET', url: `/api/v1/tasks/${task.id}/notes` });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toHaveLength(1);
            expect(res.json()[0].content).toBe('Note 1');
        });
    });

    // ─── Full Flow ─────────────────────────────────

    describe('Complete CRUD + status lifecycle', () => {
        it('create → update → complete → verify', async () => {
            // 1. Create
            const { body: task } = await createTask({ title: 'Lifecycle task', domain: 'work' });
            expect(task.status).toBe('pending');

            // 2. Update
            const updateRes = await testApp.app.inject({
                method: 'PUT',
                url: `/api/v1/tasks/${task.id}`,
                payload: { title: 'Updated lifecycle task' },
            });
            expect(updateRes.json().title).toBe('Updated lifecycle task');

            // 3. Add note
            await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/notes`,
                payload: { content: 'Started working on it' },
            });

            const completeRes = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/complete`,
            });
            expect(completeRes.json().status).toBe('done');

            const getRes = await testApp.app.inject({ method: 'GET', url: `/api/v1/tasks/${task.id}` });
            const final = getRes.json();

            expect(final.task.title).toBe('Updated lifecycle task');
            expect(final.task.status).toBe('done');
            expect(final.task.domain).toBe('work');
            expect(final.notes).toHaveLength(1);
            expect(final.notes[0].content).toBe('Started working on it');
        });
    });
});
