import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TestDatabase } from '../../../tasks/__tests__/integration/test-database';
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

async function createAccount(userId: string, name: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/wallet/accounts',
        headers: asUser(userId),
        payload: {
            name,
            currency: 'ARS',
            type: 'bank',
            initialBalance: '1000',
        },
    });

    return response.json();
}

async function createCategory(userId: string, name: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/wallet/categories',
        headers: asUser(userId),
        payload: {
            name,
            type: 'expense',
        },
    });

    return response.json();
}

async function createGoal(userId: string, name: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/wallet/savings',
        headers: asUser(userId),
        payload: {
            name,
            targetAmount: '500.00',
            currency: 'USD',
            deadline: '2026-12-31',
        },
    });

    return response.json();
}

async function createTransaction(userId: string, payload: Record<string, unknown>) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/wallet/transactions',
        headers: asUser(userId),
        payload,
    });

    return response;
}

describe('Wallet API — Cross-user isolation', () => {
    it('rejects creating a transaction with another user accountId', async () => {
        const ownCategory = await createCategory(PRIMARY_TEST_USER.id, 'Groceries');
        const foreignAccount = await createAccount(SECONDARY_TEST_USER.id, 'Other account');

        const response = await createTransaction(PRIMARY_TEST_USER.id, {
            accountId: foreignAccount.id,
            categoryId: ownCategory.id,
            type: 'expense',
            amount: '45.00',
            currency: 'ARS',
            date: '2026-03-20',
            tags: [],
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Account not found',
        });
    });

    it('rejects creating a transaction with another user categoryId', async () => {
        const ownAccount = await createAccount(PRIMARY_TEST_USER.id, 'Primary');
        const foreignCategory = await createCategory(SECONDARY_TEST_USER.id, 'Other category');

        const response = await createTransaction(PRIMARY_TEST_USER.id, {
            accountId: ownAccount.id,
            categoryId: foreignCategory.id,
            type: 'expense',
            amount: '45.00',
            currency: 'ARS',
            date: '2026-03-20',
            tags: [],
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Category not found',
        });
    });

    it('rejects updating a transaction to another user account', async () => {
        const ownAccount = await createAccount(PRIMARY_TEST_USER.id, 'Primary');
        const foreignAccount = await createAccount(SECONDARY_TEST_USER.id, 'Other account');
        const created = await createTransaction(PRIMARY_TEST_USER.id, {
            accountId: ownAccount.id,
            type: 'expense',
            amount: '45.00',
            currency: 'ARS',
            date: '2026-03-20',
            tags: [],
        });

        const response = await testApp.app.inject({
            method: 'PUT',
            url: `/api/v1/wallet/transactions/${created.json().id}`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {
                accountId: foreignAccount.id,
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Account not found',
        });
    });

    it('rejects creating an investment with another user account', async () => {
        const foreignAccount = await createAccount(SECONDARY_TEST_USER.id, 'Brokerage');

        const response = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/wallet/investments',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {
                name: 'ETF',
                type: 'cedear',
                accountId: foreignAccount.id,
                currency: 'USD',
                investedAmount: '1000.00',
                currentValue: '1000.00',
                startDate: '2026-03-20',
                endDate: null,
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Account not found',
        });
    });

    it('rejects contributing to a goal with another user transactionId', async () => {
        const ownGoal = await createGoal(PRIMARY_TEST_USER.id, 'Emergency fund');
        const foreignAccount = await createAccount(SECONDARY_TEST_USER.id, 'Foreign account');
        const foreignTransaction = await createTransaction(SECONDARY_TEST_USER.id, {
            accountId: foreignAccount.id,
            type: 'expense',
            amount: '50.00',
            currency: 'ARS',
            date: '2026-03-20',
            tags: [],
        });

        const response = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/wallet/savings/${ownGoal.id}/contribute`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {
                amount: '50.00',
                date: '2026-03-20',
                transactionId: foreignTransaction.json().id,
            },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            error: 'NOT_FOUND',
            message: 'Transaction not found',
        });
    });
});
