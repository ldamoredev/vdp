import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { TestApp } from './TestApp';
import { TestDatabase } from '../integration/test-database';
import { AgentRepository } from '../../../common/base/agents/AgentRepository';
import { SpendingSpike } from '../../../wallet/domain/events/SpendingSpike';

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
    return { status: res.statusCode, body: res.json().task ?? res.json() };
}

const userId = '00000000-0000-0000-0000-000000000001';

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

        it('returns 400 for invalid payload', async () => {
            const res = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/tasks',
                payload: { title: '' },
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().error).toBe('VALIDATION_ERROR');
            expect(res.json().message).toBe('Invalid request body');
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

    describe('GET /api/v1/tasks/insights', () => {
        it('returns recent task insights with action metadata for home surfaces', async () => {
            const { body: task } = await createTask({ title: 'Revisar presupuesto semanal' });

            const completeRes = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/complete`,
            });
            expect(completeRes.statusCode).toBe(200);

            await testApp.core.eventBus.emit(
                new SpendingSpike({
                    userId,
                    totalExpenses: '350000',
                    previousAverage: '200000',
                    percentageIncrease: 75,
                    currency: 'ARS',
                    periodFrom: '2026-03-23',
                    periodTo: '2026-03-29',
                }),
            );

            const res = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/tasks/insights',
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.insights).toHaveLength(2);
            expect(body.insights[0]).toMatchObject({
                title: 'Gasto elevado esta semana',
                type: 'warning',
                read: false,
                action: {
                    href: '/wallet',
                    label: 'Abrir Wallet',
                    domain: 'wallet',
                },
                metadata: {
                    source: 'wallet.spending.spike',
                    percentageIncrease: 75,
                },
            });
            expect(body.insights[1]).toMatchObject({
                title: 'Tarea completada',
                type: 'achievement',
                action: {
                    href: '/tasks/history',
                    label: 'Ver historial',
                    domain: 'tasks',
                },
            });
            expect(typeof body.insights[0].createdAt).toBe('string');
            expect(body.insights[0].createdAt >= body.insights[1].createdAt).toBe(true);
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

        it('returns 400 for invalid task id format', async () => {
            const res = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/tasks/not-a-uuid',
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().error).toBe('VALIDATION_ERROR');
            expect(res.json().message).toBe('Invalid request params');
        });
    });

    describe('POST /api/v1/tasks/agent/chat', () => {
        it('returns 400 when message is missing', async () => {
            const res = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/tasks/agent/chat',
                payload: {},
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().error).toBe('VALIDATION_ERROR');
            expect(res.json().message).toBe('Invalid request body');
        });

        it('streams text, tool events, and done from the tasks agent', async () => {
            const agent = testApp.core.agentRegistry.get('tasks');
            if (!agent) throw new Error('Tasks agent not registered');

            const conversationId = '11111111-1111-1111-1111-111111111111';
            const chatSpy = vi.spyOn(agent, 'chat').mockImplementation(async ({ callbacks }) => {
                callbacks.onText('Primer bloque');
                callbacks.onToolUse('list_tasks', { scheduledDate: '2026-03-18' });
                callbacks.onToolResult('list_tasks', JSON.stringify({ tasks: [{ id: 'task-1' }] }));
                callbacks.onDone(conversationId);
            });

            try {
                const res = await testApp.app.inject({
                    method: 'POST',
                    url: '/api/v1/tasks/agent/chat',
                    payload: { message: 'Que tengo hoy?' },
                });

                expect(res.statusCode).toBe(200);
                expect(res.headers['content-type']).toContain('text/event-stream');
                expect(res.body).toContain('"event":"text","text":"Primer bloque"');
                expect(res.body).toContain('"event":"tool_use","tool":"list_tasks"');
                expect(res.body).toContain('"event":"tool_result","tool":"list_tasks","summary":"1 tareas"');
                expect(res.body).toContain(`"event":"done","conversationId":"${conversationId}"`);
                expect(res.body).toContain('data: [DONE]');
            } finally {
                chatSpy.mockRestore();
            }
        });
    });

    describe('GET /api/v1/tasks/agent/conversations', () => {
        it('returns persisted task conversations ordered by recency', async () => {
            const agentRepository = testApp.core.getRepository(AgentRepository);
            const older = await agentRepository.createConversation(userId, 'tasks', 'Primera conversacion');
            await agentRepository.createMessage(older.id, 'user', 'hola');

            const newer = await agentRepository.createConversation(userId, 'tasks', 'Segunda conversacion');
            await agentRepository.createMessage(newer.id, 'user', 'que tengo hoy');

            const res = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/tasks/agent/conversations',
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body).toHaveLength(2);
            expect(body[0].title).toBe('Segunda conversacion');
            expect(body[1].title).toBe('Primera conversacion');
        });
    });

    describe('GET /api/v1/tasks/agent/conversations/:id/messages', () => {
        it('returns persisted conversation messages', async () => {
            const agentRepository = testApp.core.getRepository(AgentRepository);
            const conversation = await agentRepository.createConversation(userId, 'tasks', 'Historial');
            await agentRepository.createMessage(conversation.id, 'user', 'que hice hoy');
            await agentRepository.createAgentMessage(
                conversation.id,
                'assistant',
                'Completaste dos tareas',
                [{ id: 'tool-1', name: 'list_tasks', input: { status: 'done' } }],
            );
            await agentRepository.saveToolResult(conversation.id, 'tool', {
                tool_use_id: 'tool-1',
                content: JSON.stringify({ tasks: [{ id: 'task-1' }, { id: 'task-2' }] }),
            });

            const res = await testApp.app.inject({
                method: 'GET',
                url: `/api/v1/tasks/agent/conversations/${conversation.id}/messages`,
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body).toHaveLength(3);
            expect(body[0].role).toBe('user');
            expect(body[1].role).toBe('assistant');
            expect(body[2].role).toBe('tool');
        });

        it('returns 404 for a conversation outside the tasks domain', async () => {
            const agentRepository = testApp.core.getRepository(AgentRepository);
            const conversation = await agentRepository.createConversation(userId, 'health', 'Otra conversacion');

            const res = await testApp.app.inject({
                method: 'GET',
                url: `/api/v1/tasks/agent/conversations/${conversation.id}/messages`,
            });

            expect(res.statusCode).toBe(404);
            expect(res.json().error).toBe('NOT_FOUND');
            expect(res.json().message).toBe('Conversation not found');
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

        it('rejects lifecycle mutations through the generic update route', async () => {
            const { body: task } = await createTask({ title: 'Immutable status' });

            const res = await testApp.app.inject({
                method: 'PUT',
                url: `/api/v1/tasks/${task.id}`,
                payload: { status: 'done' },
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().error).toBe('VALIDATION_ERROR');

            const getRes = await testApp.app.inject({ method: 'GET', url: `/api/v1/tasks/${task.id}` });
            expect(getRes.statusCode).toBe(200);
            expect(getRes.json().task.status).toBe('pending');
            expect(getRes.json().task.completedAt).toBeNull();
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
