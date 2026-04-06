import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TestDatabase } from '../integration/test-database';
import { TestApp } from './TestApp';
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
});

