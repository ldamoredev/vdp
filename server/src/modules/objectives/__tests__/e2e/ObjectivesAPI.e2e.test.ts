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

async function createObjectiveAs(userId: string, overrides: Record<string, unknown> = {}) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/objectives',
        headers: asUser(userId),
        payload: {
            title: '120 horas estratégicas',
            periodStart: '2026-07-01',
            periodEnd: '2026-09-30',
            metricSource: 'projects_hours',
            target: 120,
            unit: 'h',
            ...overrides,
        },
    });
    return response.json();
}

describe('Objectives API — E2E', () => {
    it('creates, lists, reads, updates and archives an objective', async () => {
        const createdResponse = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/objectives',
            payload: {
                title: 'Leer 12 libros',
                periodStart: '2026-01-01',
                periodEnd: '2026-12-31',
                metricSource: 'manual',
                target: 12,
                unit: 'libros',
                manualValue: 2,
            },
        });
        const created = createdResponse.json();

        const listResponse = await testApp.app.inject({ method: 'GET', url: '/api/v1/objectives' });
        const readResponse = await testApp.app.inject({ method: 'GET', url: `/api/v1/objectives/${created.id}` });
        const updateResponse = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/objectives/${created.id}`,
            payload: { manualValue: 5 },
        });
        const archiveResponse = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/objectives/${created.id}/archive`,
        });

        expect(createdResponse.statusCode).toBe(201);
        expect(created).not.toHaveProperty('ownerUserId');
        expect(listResponse.json().objectives).toHaveLength(1);
        expect(readResponse.json()).toMatchObject({ id: created.id, title: 'Leer 12 libros' });
        expect(updateResponse.json()).toMatchObject({ id: created.id, manualValue: 5 });
        expect(archiveResponse.json()).toMatchObject({ id: created.id, status: 'archived' });
    });

    it('does not expose objectives across users', async () => {
        const objective = await createObjectiveAs(PRIMARY_TEST_USER.id);

        const read = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/objectives/${objective.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        const list = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/objectives',
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        const update = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/objectives/${objective.id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: { manualValue: 99 },
        });

        expect(read.statusCode).toBe(404);
        expect(list.json().objectives).toEqual([]);
        expect(update.statusCode).toBe(404);
    });

    it('marks an objective achieved and keeps ownership isolated', async () => {
        const objective = await createObjectiveAs(PRIMARY_TEST_USER.id, {
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
            manualValue: 10,
        });

        const achieved = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/objectives/${objective.id}/achieve`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        const otherUserAttempt = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/objectives/${objective.id}/achieve`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(achieved.statusCode).toBe(200);
        expect(achieved.json()).toMatchObject({ id: objective.id, status: 'achieved' });
        expect(achieved.json().achievedAt).toBeTypeOf('string');
        expect(otherUserAttempt.statusCode).toBe(404);
    });

    it('creates a health habit completion objective with a metric target', async () => {
        const response = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/objectives',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {
                title: 'Meditar 20 veces',
                periodStart: '2026-07-01',
                periodEnd: '2026-09-30',
                metricSource: 'health_habit_completions',
                metricTargetId: 'habit-1',
                target: 20,
                unit: 'veces',
            },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toMatchObject({
            metricSource: 'health_habit_completions',
            metricTargetId: 'habit-1',
            manualValue: null,
            currency: null,
        });
    });

    it('rejects invalid create payloads', async () => {
        const response = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/objectives',
            payload: {
                title: 'Rango roto',
                periodStart: '2026-10-01',
                periodEnd: '2026-09-30',
                metricSource: 'manual',
                target: 10,
                unit: 'puntos',
            },
        });

        expect(response.statusCode).toBe(400);
    });

    it('rejects partial period updates', async () => {
        const objective = await createObjectiveAs(PRIMARY_TEST_USER.id);

        const response = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/objectives/${objective.id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { periodStart: '2026-10-01' },
        });

        expect(response.statusCode).toBe(400);
    });
});
