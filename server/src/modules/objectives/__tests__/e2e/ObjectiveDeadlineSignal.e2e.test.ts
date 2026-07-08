import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ALL_TEST_USERS, PRIMARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';
import { TestDatabase } from '../../../../test/test-database';
import { localDateISO } from '../../../common/base/time/dates';
import { TasksTestApp } from './TasksTestApp';

const testDb = new TestDatabase();
const testApp = new TasksTestApp();

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

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return localDateISO(d);
}

async function createObjective(overrides: Record<string, unknown> = {}) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/objectives',
        headers: asUser(PRIMARY_TEST_USER.id),
        payload: {
            title: 'Objetivo con deadline',
            periodStart: daysAgo(30),
            periodEnd: daysAgo(-14),
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
            manualValue: 3,
            ...overrides,
        },
    });
    return response.json();
}

async function pollForTask(
    attempts = 10,
    delay = 100,
): Promise<{ id: string; title: string; description: string } | null> {
    for (let i = 0; i < attempts; i++) {
        const response = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/tasks',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        const tasks = response.json().tasks as Array<{ id: string; title: string; description: string }>;
        const task = tasks.find((t) => t.title.includes('Decidir objetivo'));
        if (task) return task;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return null;
}

describe('Objectives deadline signal — E2E', () => {
    it('creates exactly one decision task and insight when the overview loads near the deadline', async () => {
        await createObjective();

        const overviewResponse = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/objectives/overview',
            headers: asUser(PRIMARY_TEST_USER.id),
        });

        expect(overviewResponse.statusCode).toBe(200);
        expect(overviewResponse.json().objectives).toHaveLength(1);

        const task = await pollForTask();
        expect(task).not.toBeNull();
        expect(task?.title).toContain('Decidir objetivo');

        const insightsResponse = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/tasks/insights',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        const insights = insightsResponse.json().insights as Array<{ title: string; type: string }>;
        expect(insights).toHaveLength(1);
        expect(insights[0].title).toContain('Objetivo cerca del límite');
        expect(insights[0].type).toBe('warning');

        // Second overview load must not duplicate the signal.
        await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/objectives/overview',
            headers: asUser(PRIMARY_TEST_USER.id),
        });

        const tasksAfterSecondLoad = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/tasks',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(tasksAfterSecondLoad.json().tasks).toHaveLength(1);
    });

    it('does not emit the signal when the manual objective has reached its target', async () => {
        await createObjective({ manualValue: 10 });

        await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/objectives/overview',
            headers: asUser(PRIMARY_TEST_USER.id),
        });

        const tasksResponse = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/tasks',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(tasksResponse.json().tasks).toHaveLength(0);
    });
});
