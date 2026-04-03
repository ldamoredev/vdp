import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FakeTransactionRepository } from '../../infrastructure/fake/FakeTransactionRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { DetectSpendingSpike } from '../../services/DetectSpendingSpike';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import type { Transaction } from '../../domain/Transaction';
import type { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: overrides.id ?? crypto.randomUUID(),
        accountId: overrides.accountId ?? 'acc-1',
        categoryId: overrides.categoryId ?? null,
        type: overrides.type ?? 'expense',
        amount: overrides.amount ?? '100',
        currency: overrides.currency ?? 'ARS',
        description: overrides.description ?? 'Test',
        date: overrides.date ?? '2026-03-15',
        transferToAccountId: overrides.transferToAccountId ?? null,
        tags: overrides.tags ?? [],
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

function mondayOfWeek(weeksAgo: number, referenceDate: Date = new Date()): string {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 7 * weeksAgo);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function midWeekDate(weeksAgo: number, referenceDate: Date = new Date()): string {
    const monday = mondayOfWeek(weeksAgo, referenceDate);
    const d = new Date(monday);
    d.setDate(d.getDate() + 2); // Wednesday
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

describe('DetectSpendingSpike', () => {
    let transactions: FakeTransactionRepository;
    let eventBus: EventBus;
    let service: DetectSpendingSpike;
    const logger = new NoOpLogger();

    beforeEach(() => {
        transactions = new FakeTransactionRepository();
        eventBus = new EventBus();
        service = new DetectSpendingSpike(transactions, eventBus, logger);
    });

    it('does not emit when current week expenses are zero', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.spending.spike', (e) => { emitted.push(e); });

        await service.execute();

        expect(emitted).toHaveLength(0);
    });

    it('does not emit when previous average is zero (first week of spending)', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.spending.spike', (e) => { emitted.push(e); });

        // Only current week has expenses, no history
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        transactions.seed([createTransaction({ amount: '500', date: todayStr })]);

        await service.execute();

        expect(emitted).toHaveLength(0);
    });

    it('emits SpendingSpike when current week exceeds 50% of 4-week average', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.spending.spike', (e) => { emitted.push(e); });

        // Previous 4 weeks: ~100 each
        for (let i = 1; i <= 4; i++) {
            transactions.seed([
                createTransaction({
                    amount: '100',
                    date: midWeekDate(i),
                }),
            ]);
        }

        // Current week: 200 (100% increase over 100 avg → exceeds 50% threshold)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        transactions.seed([createTransaction({ amount: '200', date: todayStr })]);

        await service.execute();

        expect(emitted).toHaveLength(1);

        const payload = emitted[0].payload as Record<string, unknown>;
        expect(payload.totalExpenses).toBe('200.00');
        expect(payload.previousAverage).toBe('100.00');
        expect(payload.percentageIncrease).toBe(100);
        expect(payload.currency).toBe('ARS');
    });

    it('does not emit when increase is below 50% threshold', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.spending.spike', (e) => { emitted.push(e); });

        // Previous 4 weeks: 100 each
        for (let i = 1; i <= 4; i++) {
            transactions.seed([
                createTransaction({
                    amount: '100',
                    date: midWeekDate(i),
                }),
            ]);
        }

        // Current week: 140 (40% increase → below 50% threshold)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        transactions.seed([createTransaction({ amount: '140', date: todayStr })]);

        await service.execute();

        expect(emitted).toHaveLength(0);
    });

    it('emits when increase is exactly at the 50% threshold', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.spending.spike', (e) => { emitted.push(e); });

        // Previous 4 weeks: 100 each
        for (let i = 1; i <= 4; i++) {
            transactions.seed([
                createTransaction({
                    amount: '100',
                    date: midWeekDate(i),
                }),
            ]);
        }

        // Current week: 150 (exactly 50% increase)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        transactions.seed([createTransaction({ amount: '150', date: todayStr })]);

        await service.execute();

        expect(emitted).toHaveLength(1);
        const payload = emitted[0].payload as Record<string, unknown>;
        expect(payload.percentageIncrease).toBe(50);
    });

    it('uses absolute values for expense amounts', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.spending.spike', (e) => { emitted.push(e); });

        // Previous weeks with negative amounts (how some repos store expenses)
        for (let i = 1; i <= 4; i++) {
            transactions.seed([
                createTransaction({
                    amount: '-100',
                    date: midWeekDate(i),
                }),
            ]);
        }

        // Current week: negative but absolute 200
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        transactions.seed([createTransaction({ amount: '-200', date: todayStr })]);

        await service.execute();

        expect(emitted).toHaveLength(1);
    });
});
