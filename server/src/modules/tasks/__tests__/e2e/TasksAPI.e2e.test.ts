import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { TestApp } from './TestApp';
import { TestDatabase } from '../integration/test-database';
import { AgentRepository } from '../../../common/base/agents/AgentRepository';
import { SpendingSpike } from '../../../wallet/domain/events/SpendingSpike';
import { SECONDARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';
import { localDateISO, todayISO } from '../../../common/base/time/dates';
import { ScriptedAgentProvider, withScriptedProvider } from './ScriptedAgentProvider';

const testDb = new TestDatabase();
const testApp = new TestApp();

beforeAll(async () => {
    await testDb.setup();
    await testApp.setup();
}, 30_000);

beforeEach(async () => {
    await testDb.truncate();

    const insightsController = testApp.core
        .getControllers()
        .find((controller) => controller.prefix === '/api/v1/tasks/insights') as
        | {
            insightsStore?: {
                reset: () => void;
            };
        }
        | undefined;

    insightsController?.insightsStore?.reset();
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
                    href: '/wallet/transactions?from=2026-03-23&to=2026-03-29',
                    label: 'Revisar movimientos',
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

        it('resolves explicit metadata actions even when actionDomain is omitted', async () => {
            const insightsController = testApp.core
                .getControllers()
                .find((controller) => controller.prefix === '/api/v1/tasks/insights') as
                | {
                    insightsStore?: {
                        addInsight: (input: {
                            userId: string;
                            type: 'achievement' | 'warning' | 'suggestion';
                            title: string;
                            message: string;
                            metadata?: Record<string, unknown>;
                        }) => unknown;
                    };
                }
                | undefined;

            expect(insightsController?.insightsStore).toBeDefined();

            insightsController!.insightsStore!.addInsight({
                userId,
                type: 'warning',
                title: 'Accion explicita',
                message: 'Mensaje',
                metadata: {
                    source: 'wallet.spending.spike',
                    actionHref: '/wallet/transactions?from=2026-03-30&to=2026-04-05',
                    actionLabel: 'Revisar movimientos',
                },
            });

            const res = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/tasks/insights',
            });

            expect(res.statusCode).toBe(200);
            expect(res.json().insights[0]).toMatchObject({
                title: 'Accion explicita',
                action: {
                    href: '/wallet/transactions?from=2026-03-30&to=2026-04-05',
                    label: 'Revisar movimientos',
                    domain: 'wallet',
                },
                metadata: {
                    source: 'wallet.spending.spike',
                    actionHref: '/wallet/transactions?from=2026-03-30&to=2026-04-05',
                    actionLabel: 'Revisar movimientos',
                },
            });
        });

        it('does not expose another users insights', async () => {
            const { body: task } = await createTask({ title: 'Insight privado' });

            const completeRes = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/complete`,
            });
            expect(completeRes.statusCode).toBe(200);

            const res = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/tasks/insights',
                headers: {
                    [TEST_USER_ID_HEADER]: SECONDARY_TEST_USER.id,
                },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ insights: [] });
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

        it('runs the real agent loop and executes a tool scoped to the auth-context user', async () => {
            const agent = testApp.core.agentRegistry.get('tasks');
            if (!agent) throw new Error('Tasks agent not registered');

            // First turn asks to create a task; second turn closes the conversation.
            const provider = new ScriptedAgentProvider([
                {
                    text: '',
                    toolCalls: [
                        { id: 'call-1', name: 'create_task', input: { title: 'Tarea creada por el agente', priority: 3 } },
                    ],
                    stopReason: 'tool_use',
                },
                { text: 'Listo, cree la tarea.', toolCalls: [], stopReason: 'end_turn' },
            ]);
            const swap = withScriptedProvider(agent, provider);

            try {
                const res = await testApp.app.inject({
                    method: 'POST',
                    url: '/api/v1/tasks/agent/chat',
                    payload: { message: 'Crea una tarea para hoy' },
                });

                expect(res.statusCode).toBe(200);
                expect(res.body).toContain('"event":"tool_use","tool":"create_task"');
                expect(res.body).toContain('"event":"tool_result","tool":"create_task"');
                expect(res.body).toContain('"event":"done"');
                expect(res.body).toContain('data: [DONE]');
                // One generate to emit the tool call, one to finish after the result.
                expect(provider.calls).toHaveLength(2);

                // The tool actually persisted the task for the requesting user.
                const list = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks' });
                const titles = list.json().tasks.map((task: { title: string }) => task.title);
                expect(titles).toContain('Tarea creada por el agente');
            } finally {
                swap.restore();
            }
        });

        it('rejects an invalid date the agent passes to a tool without persisting anything', async () => {
            const agent = testApp.core.agentRegistry.get('tasks');
            if (!agent) throw new Error('Tasks agent not registered');

            const provider = new ScriptedAgentProvider([
                {
                    text: '',
                    toolCalls: [
                        { id: 'call-1', name: 'create_task', input: { title: 'Tarea con fecha mala', scheduledDate: '2026-13-40' } },
                    ],
                    stopReason: 'tool_use',
                },
                { text: 'No pude crearla.', toolCalls: [], stopReason: 'end_turn' },
            ]);
            const swap = withScriptedProvider(agent, provider);

            try {
                const res = await testApp.app.inject({
                    method: 'POST',
                    url: '/api/v1/tasks/agent/chat',
                    payload: { message: 'Crea una tarea para el 40 de diciembre' },
                });

                expect(res.statusCode).toBe(200);
                expect(res.body).toContain('"event":"tool_result","tool":"create_task"');
                expect(res.body).toContain('scheduledDate');

                // Nothing was persisted from the malformed date.
                const list = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks' });
                expect(list.json().tasks).toHaveLength(0);
            } finally {
                swap.restore();
            }
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
                payload: { toDate: '2099-03-25' },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json().scheduledDate).toBe('2099-03-25');
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

    describe('POST /api/v1/tasks/carry-over-all', () => {
        it('carries over all pending tasks from a date', async () => {
            const today = todayISO();
            await createTask({ title: 'Pending 1', scheduledDate: today });
            await createTask({ title: 'Pending 2', scheduledDate: today });
            const { body: done } = await createTask({ title: 'Already done', scheduledDate: today });
            await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${done.id}/complete` });

            const res = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/tasks/carry-over-all',
                payload: { fromDate: today, toDate: '2099-04-02' },
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.carriedOver).toBe(2);
            expect(body.tasks).toHaveLength(2);
            for (const task of body.tasks) {
                expect(task.scheduledDate).toBe('2099-04-02');
                expect(task.carryOverCount).toBe(1);
            }
        });

        it('returns 400 for a malformed fromDate', async () => {
            const res = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/tasks/carry-over-all',
                payload: { fromDate: 'not-a-date' },
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().error).toBe('VALIDATION_ERROR');
        });
    });

    // ─── Stats & Review ────────────────────────────

    describe('GET /api/v1/tasks/stats/today', () => {
        it('returns completion stats for today', async () => {
            await createTask({ title: 'A' });
            const { body: b } = await createTask({ title: 'B' });
            await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${b.id}/complete` });

            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks/stats/today' });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.date).toBe(todayISO());
            expect(body.total).toBe(2);
            expect(body.completed).toBe(1);
            expect(body.pending).toBe(1);
            expect(body.completionRate).toBe(50);
        });
    });

    describe('GET /api/v1/tasks/stats/trend', () => {
        it('returns one entry per day in the requested window, most recent first', async () => {
            await createTask({ title: 'Today task' });

            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks/stats/trend?days=7' });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body).toHaveLength(7);
            expect(body[0].date).toBe(todayISO());
            expect(body[0].total).toBe(1);
        });

        it('returns 400 for days above the allowed window', async () => {
            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks/stats/trend?days=500' });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/v1/tasks/stats/by-domain', () => {
        it('groups completed tasks by domain', async () => {
            const { body: w1 } = await createTask({ title: 'W1', domain: 'work' });
            const { body: w2 } = await createTask({ title: 'W2', domain: 'work' });
            for (const task of [w1, w2]) {
                await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${task.id}/complete` });
            }

            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks/stats/by-domain' });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            const work = body.find((stat: { domain: string | null }) => stat.domain === 'work');
            expect(work?.count).toBe(2);
        });
    });

    describe('GET /api/v1/tasks/stats/carry-over', () => {
        it('returns the carry-over rate over the window', async () => {
            const today = todayISO();
            const cursor = new Date();
            cursor.setDate(cursor.getDate() - 2);
            const twoDaysAgo = localDateISO(cursor);
            cursor.setDate(cursor.getDate() + 1);
            const oneDayAgo = localDateISO(cursor);

            await createTask({ title: 'Untouched', scheduledDate: today });
            // Pull an overdue task forward — still inside the 7-day window.
            const { body: carried } = await createTask({ title: 'Carried', scheduledDate: twoDaysAgo });
            await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${carried.id}/carry-over`,
                payload: { toDate: oneDayAgo },
            });

            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks/stats/carry-over?days=7' });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.total).toBe(2);
            expect(body.carriedOver).toBe(1);
            expect(body.rate).toBe(50);
            expect(body.days).toBe(7);
        });
    });

    describe('GET /api/v1/tasks/review', () => {
        it('returns the end-of-day review for today', async () => {
            await createTask({ title: 'Pending review task' });
            const { body: done } = await createTask({ title: 'Done review task' });
            await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${done.id}/complete` });

            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks/review' });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.date).toBe(todayISO());
            expect(body.total).toBe(2);
            expect(body.completed).toBe(1);
            expect(body.pending).toBe(1);
            expect(body.pendingTasks).toHaveLength(1);
            expect(body.pendingTasks[0].title).toBe('Pending review task');
            expect(Array.isArray(body.recommendations)).toBe(true);
        });

        it('returns 400 for a malformed date query', async () => {
            const res = await testApp.app.inject({ method: 'GET', url: '/api/v1/tasks/review?date=2026-99-99' });
            expect(res.statusCode).toBe(400);
            expect(res.json().error).toBe('VALIDATION_ERROR');
        });
    });

    // ─── Validation & lifecycle errors ─────────────

    describe('Validation guards', () => {
        it('rejects creating a task with a malformed scheduledDate', async () => {
            const res = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/tasks',
                payload: { title: 'Bad date', scheduledDate: '2026-13-40' },
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().error).toBe('VALIDATION_ERROR');
        });

        it('rejects carrying over a task that is not pending', async () => {
            const { body: task } = await createTask({ title: 'Done then carry' });
            await testApp.app.inject({ method: 'POST', url: `/api/v1/tasks/${task.id}/complete` });

            const res = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/carry-over`,
                payload: { toDate: '2026-04-02' },
            });

            expect(res.statusCode).toBe(422);
            expect(res.json().error).toBe('DOMAIN_ERROR');
        });

        it('rejects carrying a task over to its own day', async () => {
            const today = todayISO();
            const { body: task } = await createTask({ title: 'Same day carry', scheduledDate: today });

            const res = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/tasks/${task.id}/carry-over`,
                payload: { toDate: today },
            });

            expect(res.statusCode).toBe(422);
            expect(res.json().error).toBe('DOMAIN_ERROR');

            // The task keeps its date and carry-over counter untouched.
            const getRes = await testApp.app.inject({ method: 'GET', url: `/api/v1/tasks/${task.id}` });
            expect(getRes.json().task.scheduledDate).toBe(today);
            expect(getRes.json().task.carryOverCount).toBe(0);
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
