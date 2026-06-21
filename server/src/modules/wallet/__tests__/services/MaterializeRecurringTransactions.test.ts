import { describe, it, expect, beforeEach } from 'vitest';

import { RecurringTransaction, RecurringTransactionSnapshot } from '../../domain/RecurringTransaction';
import { MaterializeRecurringTransactions } from '../../services/MaterializeRecurringTransactions';
import { FakeRecurringTransactionRepository } from '../fakes/FakeRecurringTransactionRepository';
import { FakeTransactionRepository } from '../fakes/FakeTransactionRepository';

const userId = 'user-1';

function rule(overrides: Partial<RecurringTransactionSnapshot> = {}): RecurringTransaction {
    return RecurringTransaction.fromSnapshot({
        id: 'r1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: '50000',
        currency: 'ARS',
        description: 'Alquiler',
        dayOfMonth: 1,
        startDate: '2026-04-01',
        endDate: null,
        lastRunDate: null,
        active: true,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
        ...overrides,
    });
}

describe('MaterializeRecurringTransactions', () => {
    let recurring: FakeRecurringTransactionRepository;
    let transactions: FakeTransactionRepository;
    let service: MaterializeRecurringTransactions;

    beforeEach(() => {
        recurring = new FakeRecurringTransactionRepository();
        transactions = new FakeTransactionRepository();
        service = new MaterializeRecurringTransactions(recurring, transactions);
    });

    const listTx = async () => (await transactions.list(userId, { limit: 100 })).transactions;

    it('creates a transaction per due occurrence and advances the marker', async () => {
        recurring.seed([rule()]);

        const created = await service.execute(userId, '2026-06-17');

        expect(created).toBe(3);
        const txs = await listTx();
        expect(txs.map((t) => t.date).sort()).toEqual(['2026-04-01', '2026-05-01', '2026-06-01']);
        expect(txs.every((t) => t.amount === '50000' && t.type === 'expense' && t.categoryId === 'cat-1')).toBe(true);
        expect(txs.every((t) => t.tags.includes('recurrente'))).toBe(true);
        expect((await recurring.findById(userId, 'r1'))?.lastRunDate).toBe('2026-06-01');
    });

    it('is idempotent across loads', async () => {
        recurring.seed([rule()]);

        await service.execute(userId, '2026-06-17');
        const again = await service.execute(userId, '2026-06-17');

        expect(again).toBe(0);
        expect((await listTx()).length).toBe(3);
    });

    it('never duplicates an occurrence under concurrent runs (boundary race)', async () => {
        recurring.seed([rule()]);

        // Two dashboard loads (e.g. React StrictMode double-mount) racing.
        await Promise.all([
            service.execute(userId, '2026-06-17'),
            service.execute(userId, '2026-06-17'),
        ]);

        const txs = await listTx();
        expect(txs.map((t) => t.date).sort()).toEqual(['2026-04-01', '2026-05-01', '2026-06-01']);
    });

    it('skips inactive rules', async () => {
        recurring.seed([rule({ active: false })]);

        const created = await service.execute(userId, '2026-06-17');

        expect(created).toBe(0);
        expect(await listTx()).toEqual([]);
    });
});
