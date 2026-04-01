import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentRepository } from '../../../common/base/agents/AgentRepository';
import { TestDatabase } from '../integration/test-database';
import { TestApp } from './TestApp';

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

async function createAccount(data: Record<string, unknown> = {}) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/wallet/accounts',
        payload: {
            name: 'Primary account',
            currency: 'ARS',
            type: 'bank',
            initialBalance: '1000',
            ...data,
        },
    });

    return { status: response.statusCode, body: response.json() };
}

async function createCategory(data: Record<string, unknown> = {}) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/wallet/categories',
        payload: {
            name: 'General',
            type: 'expense',
            ...data,
        },
    });

    return { status: response.statusCode, body: response.json() };
}

async function createTransaction(data: Record<string, unknown> = {}) {
    const account = data.accountId ? null : await createAccount();
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/wallet/transactions',
        payload: {
            accountId: data.accountId ?? account!.body.id,
            type: 'expense',
            amount: '100.00',
            currency: 'ARS',
            date: '2026-03-20',
            tags: [],
            ...data,
        },
    });

    return { status: response.statusCode, body: response.json() };
}

describe('Wallet API — E2E', () => {
    describe('accounts', () => {
        it('creates and lists accounts', async () => {
            const created = await createAccount({ name: 'Checking', initialBalance: '2500.75' });

            expect(created.status).toBe(201);
            expect(created.body.name).toBe('Checking');

            const listResponse = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/wallet/accounts',
            });

            expect(listResponse.statusCode).toBe(200);
            const accounts = listResponse.json();
            expect(accounts).toHaveLength(1);
            expect(accounts[0].currentBalance).toBe('2500.75');
        });

        it('returns 400 for invalid account payloads', async () => {
            const response = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/wallet/accounts',
                payload: { name: '', currency: 'EUR', type: 'bank' },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('VALIDATION_ERROR');
            expect(response.json().message).toBe('Invalid request body');
        });
    });

    describe('transactions', () => {
        it('returns paginated transactions with filters', async () => {
            const { body: account } = await createAccount();
            const { body: category } = await createCategory({ name: 'Groceries' });

            await createTransaction({
                accountId: account.id,
                categoryId: category.id,
                description: 'Weekly groceries',
                amount: '120.50',
                date: '2026-03-18',
            });
            await createTransaction({
                accountId: account.id,
                type: 'income',
                description: 'Salary',
                amount: '900.00',
                date: '2026-03-19',
            });

            const response = await testApp.app.inject({
                method: 'GET',
                url: `/api/v1/wallet/transactions?accountId=${account.id}&search=groceries&type=expense`,
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.total).toBe(1);
            expect(body.transactions).toHaveLength(1);
            expect(body.transactions[0].description).toBe('Weekly groceries');
        });
    });

    describe('stats', () => {
        it('returns summary, by-category, and monthly trend data', async () => {
            const { body: account } = await createAccount();
            const { body: groceries } = await createCategory({ name: 'Groceries' });
            const { body: transport } = await createCategory({ name: 'Transport' });

            await createTransaction({
                accountId: account.id,
                categoryId: groceries.id,
                description: 'Groceries',
                amount: '120.50',
                date: '2026-03-18',
            });
            await createTransaction({
                accountId: account.id,
                categoryId: transport.id,
                description: 'Bus pass',
                amount: '60.00',
                date: '2026-03-19',
            });
            await createTransaction({
                accountId: account.id,
                type: 'income',
                description: 'Salary',
                amount: '900.00',
                date: '2026-03-20',
            });

            const summaryResponse = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/wallet/stats/summary?from=2026-03-01&to=2026-03-31',
            });
            expect(summaryResponse.statusCode).toBe(200);
            expect(summaryResponse.json()).toMatchObject({
                totalIncome: '900.00',
                totalExpenses: '180.50',
                netBalance: '719.50',
                transactionCount: 3,
            });

            const categoryResponse = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/wallet/stats/by-category?from=2026-03-01&to=2026-03-31',
            });
            expect(categoryResponse.statusCode).toBe(200);
            expect(categoryResponse.json()).toEqual([
                expect.objectContaining({ categoryName: 'Groceries', total: 120.5, count: 1 }),
                expect.objectContaining({ categoryName: 'Transport', total: 60, count: 1 }),
            ]);

            const trendResponse = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/wallet/stats/monthly-trend?year=2026',
            });
            expect(trendResponse.statusCode).toBe(200);
            expect(trendResponse.json()).toEqual([
                expect.objectContaining({ month: '2026-03', income: 900, expense: 180.5 }),
            ]);
        });
    });

    describe('savings', () => {
        it('creates goals and contributes toward them', async () => {
            const goalResponse = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/wallet/savings',
                payload: {
                    name: 'Emergency fund',
                    targetAmount: '500.00',
                    currency: 'USD',
                    deadline: '2026-12-31',
                },
            });

            expect(goalResponse.statusCode).toBe(201);
            const goal = goalResponse.json();

            const contributionResponse = await testApp.app.inject({
                method: 'POST',
                url: `/api/v1/wallet/savings/${goal.id}/contribute`,
                payload: {
                    amount: '500.00',
                    date: '2026-03-21',
                    note: 'Bonus allocation',
                },
            });

            expect(contributionResponse.statusCode).toBe(200);
            expect(contributionResponse.json()).toMatchObject({
                id: goal.id,
                currentAmount: '500.00',
                isCompleted: true,
            });
        });
    });

    describe('investments', () => {
        it('creates, updates, and lists investments', async () => {
            const { body: account } = await createAccount({ currency: 'USD', type: 'investment' });

            const createResponse = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/wallet/investments',
                payload: {
                    name: 'NASDAQ ETF',
                    type: 'cedear',
                    accountId: account.id,
                    currency: 'USD',
                    investedAmount: '1000.00',
                    currentValue: '1035.50',
                    startDate: '2026-02-01',
                    endDate: null,
                    rate: '0.0355',
                    notes: 'Growth allocation',
                },
            });

            expect(createResponse.statusCode).toBe(201);
            const created = createResponse.json();

            const updateResponse = await testApp.app.inject({
                method: 'PUT',
                url: `/api/v1/wallet/investments/${created.id}`,
                payload: {
                    currentValue: '1080.25',
                    notes: 'Updated valuation',
                },
            });

            expect(updateResponse.statusCode).toBe(200);
            expect(updateResponse.json()).toMatchObject({
                id: created.id,
                currentValue: '1080.25',
                notes: 'Updated valuation',
            });

            const listResponse = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/wallet/investments',
            });

            expect(listResponse.statusCode).toBe(200);
            expect(listResponse.json()).toHaveLength(1);
        });
    });

    describe('exchange rates', () => {
        it('returns only the latest rate per pair and type', async () => {
            await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/wallet/exchange-rates',
                payload: {
                    fromCurrency: 'USD',
                    toCurrency: 'ARS',
                    rate: '1095.1000',
                    type: 'blue',
                    date: '2026-03-20',
                },
            });
            await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/wallet/exchange-rates',
                payload: {
                    fromCurrency: 'USD',
                    toCurrency: 'ARS',
                    rate: '1102.2500',
                    type: 'blue',
                    date: '2026-03-21',
                },
            });
            await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/wallet/exchange-rates',
                payload: {
                    fromCurrency: 'USD',
                    toCurrency: 'ARS',
                    rate: '1085.5000',
                    type: 'official',
                    date: '2026-03-21',
                },
            });

            const response = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/wallet/exchange-rates/latest',
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual([
                expect.objectContaining({ type: 'blue', rate: '1102.2500', date: '2026-03-21' }),
                expect.objectContaining({ type: 'official', rate: '1085.5000', date: '2026-03-21' }),
            ]);
        });
    });

    describe('wallet agent', () => {
        it('returns 400 when message is missing', async () => {
            const response = await testApp.app.inject({
                method: 'POST',
                url: '/api/v1/wallet/agent/chat',
                payload: {},
            });

            expect(response.statusCode).toBe(400);
            expect(response.json().error).toBe('VALIDATION_ERROR');
        });

        it('streams text, tool events, and done from the wallet agent', async () => {
            const agent = testApp.core.agentRegistry.get('wallet');
            if (!agent) throw new Error('Wallet agent not registered');

            const conversationId = '22222222-2222-2222-2222-222222222222';
            const chatSpy = vi.spyOn(agent, 'chat').mockImplementation(async ({ callbacks }) => {
                callbacks.onText('Resumen financiero');
                callbacks.onToolUse('list_accounts', {});
                callbacks.onToolResult('list_accounts', JSON.stringify([{ id: 'acc-1' }]));
                callbacks.onDone(conversationId);
            });

            try {
                const response = await testApp.app.inject({
                    method: 'POST',
                    url: '/api/v1/wallet/agent/chat',
                    payload: { message: 'Como vengo este mes?' },
                });

                expect(response.statusCode).toBe(200);
                expect(response.headers['content-type']).toContain('text/event-stream');
                expect(response.body).toContain('"event":"text","text":"Resumen financiero"');
                expect(response.body).toContain('"event":"tool_use","tool":"list_accounts"');
                expect(response.body).toContain('"event":"tool_result","tool":"list_accounts","summary":"1 resultados"');
                expect(response.body).toContain(`"event":"done","conversationId":"${conversationId}"`);
                expect(response.body).toContain('data: [DONE]');
            } finally {
                chatSpy.mockRestore();
            }
        });

        it('returns wallet conversations and messages only for the wallet domain', async () => {
            const agentRepository = testApp.core.getRepository(AgentRepository);
            const conversation = await agentRepository.createConversation('wallet', 'Wallet history');
            await agentRepository.createMessage(conversation.id, 'user', 'Resumen');
            await agentRepository.createAgentMessage(conversation.id, 'assistant', 'Aca va tu resumen', null);

            await agentRepository.createConversation('tasks', 'Task history');

            const conversationsResponse = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/wallet/agent/conversations',
            });

            expect(conversationsResponse.statusCode).toBe(200);
            expect(conversationsResponse.json()).toHaveLength(1);
            expect(conversationsResponse.json()[0].title).toBe('Wallet history');

            const messagesResponse = await testApp.app.inject({
                method: 'GET',
                url: `/api/v1/wallet/agent/conversations/${conversation.id}/messages`,
            });

            expect(messagesResponse.statusCode).toBe(200);
            expect(messagesResponse.json()).toHaveLength(2);
            expect(messagesResponse.json()[0].role).toBe('user');
            expect(messagesResponse.json()[1].role).toBe('assistant');
        });
    });
});
