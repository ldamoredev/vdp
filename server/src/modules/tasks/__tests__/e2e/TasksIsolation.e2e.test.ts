import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TestDatabase } from '../integration/test-database';
import { TestApp } from './TestApp';
import { AgentRepository } from '../../../common/base/agents/AgentRepository';
import { ALL_TEST_USERS, PRIMARY_TEST_USER, SECONDARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';

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

async function createTaskAs(userId: string, title: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/tasks',
        headers: asUser(userId),
        payload: { title },
    });

    return response.json().task ?? response.json();
}

describe('Tasks API — Cross-user isolation', () => {
    it('does not let another user read a task', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/tasks/${task.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Task not found',
        });
    });

    it('does not let another user update a task', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/tasks/${task.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: { title: 'Stolen task' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Task not found',
        });
    });

    it('does not let another user delete a task', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'DELETE',
            url: `/api/v1/tasks/${task.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Task not found',
        });
    });

    it('does not expose another users tasks in the list', async () => {
        await createTaskAs(PRIMARY_TEST_USER.id, 'Owner only');

        const response = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/tasks',
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.tasks).toHaveLength(0);
        expect(body.total).toBe(0);
    });

    it('does not let another user complete a task', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/tasks/${task.id}/complete`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Task not found' });

        // The owner's task is untouched.
        const ownerView = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/tasks/${task.id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(ownerView.json().task.status).toBe('pending');
    });

    it('does not let another user carry over a task', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/tasks/${task.id}/carry-over`,
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: { toDate: '2026-04-02' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Task not found' });
    });

    it('does not let another user discard a task', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/tasks/${task.id}/discard`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Task not found' });
    });

    it('does not let another user add a note to a task', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');

        const response = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/tasks/${task.id}/notes`,
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: { content: 'Sneaky note' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND' });
    });

    it('does not let another user read a tasks notes', async () => {
        const task = await createTaskAs(PRIMARY_TEST_USER.id, 'Private task');
        await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/tasks/${task.id}/notes`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { content: 'Owner note' },
        });

        const response = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/tasks/${task.id}/notes`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Task not found' });
    });

    it('carry-over-all does not touch another users pending tasks', async () => {
        const ownerTask = await createTaskAs(PRIMARY_TEST_USER.id, 'Owner pending');
        const fromDate = ownerTask.scheduledDate;

        const response = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/tasks/carry-over-all',
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: { fromDate, toDate: '2026-04-02' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({ carriedOver: 0, tasks: [] });

        // Owner's task keeps its original schedule.
        const ownerView = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/tasks/${ownerTask.id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(ownerView.json().task.scheduledDate).toBe(fromDate);
        expect(ownerView.json().task.carryOverCount).toBe(0);
    });

    it('does not expose another users agent conversations or messages', async () => {
        const agentRepository = testApp.core.getRepository(AgentRepository);
        const conversation = await agentRepository.createConversation(PRIMARY_TEST_USER.id, 'tasks', 'Privada');
        await agentRepository.createMessage(conversation.id, 'user', 'hola privado');

        const listRes = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/tasks/agent/conversations',
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(listRes.statusCode).toBe(200);
        expect(listRes.json()).toHaveLength(0);

        const messagesRes = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/tasks/agent/conversations/${conversation.id}/messages`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(messagesRes.statusCode).toBe(404);
        expect(messagesRes.json()).toMatchObject({ error: 'NOT_FOUND', message: 'Conversation not found' });
    });
});

