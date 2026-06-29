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

async function captureAs(userId: string, text: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/inbox',
        headers: asUser(userId),
        payload: { text },
    });
    return response;
}

describe('Inbox API — E2E', () => {
    it('captures, lists and discards an item', async () => {
        const created = await captureAs(PRIMARY_TEST_USER.id, 'Idea para el blog');
        expect(created.statusCode).toBe(201);
        const item = created.json();
        expect(item).toMatchObject({ text: 'Idea para el blog', status: 'pending', routedTo: null });

        const list = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/inbox',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(list.json().items.map((i: { id: string }) => i.id)).toEqual([item.id]);

        const discarded = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/inbox/${item.id}/discard`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(discarded.statusCode).toBe(200);
        expect(discarded.json().status).toBe('discarded');
    });

    it('triages an item to a destination', async () => {
        const created = await captureAs(PRIMARY_TEST_USER.id, 'Pagar la luz');
        const id = created.json().id;

        const triaged = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/inbox/${id}/triage`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { routedTo: 'wallet' },
        });
        expect(triaged.statusCode).toBe(200);
        expect(triaged.json()).toMatchObject({ status: 'triaged', routedTo: 'wallet' });

        const list = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/inbox',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(list.json().items.find((i: { id: string }) => i.id === id).status).toBe('triaged');
    });

    it('rejects an empty capture', async () => {
        const response = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/inbox',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { text: '' },
        });
        expect(response.statusCode).toBe(400);
    });

    it('isolates items across users', async () => {
        const created = await captureAs(PRIMARY_TEST_USER.id, 'Privado');
        const id = created.json().id;

        const read = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/inbox/${id}`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        const discard = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/inbox/${id}/discard`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        const otherList = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/inbox',
            headers: asUser(SECONDARY_TEST_USER.id),
        });

        expect(read.statusCode).toBe(404);
        expect(discard.statusCode).toBe(404);
        expect(otherList.json().items).toEqual([]);
    });
});
