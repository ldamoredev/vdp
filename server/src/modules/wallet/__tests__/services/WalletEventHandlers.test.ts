import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { WalletEventHandlers } from '../../services/WalletEventHandlers';
import { DetectSpendingSpike } from '../../services/DetectSpendingSpike';
import { TransactionCreated } from '../../domain/events/TransactionCreated';
import { SpendingSpike } from '../../domain/events/SpendingSpike';
import { WalletInsightsStore } from '../../services/WalletInsightsStore';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';

function createMockDetectSpendingSpike(
    executeFn: () => Promise<void> = async () => {},
): DetectSpendingSpike {
    return { execute: executeFn } as unknown as DetectSpendingSpike;
}

describe('WalletEventHandlers', () => {
    let eventBus: EventBus;
    const logger = new NoOpLogger();
    let insightsStore: WalletInsightsStore;

    beforeEach(() => {
        eventBus = new EventBus();
        insightsStore = new WalletInsightsStore();
    });

    it('calls DetectSpendingSpike.execute when a transaction is created', async () => {
        const executeFn = vi.fn(async () => {});
        const spike = createMockDetectSpendingSpike(executeFn);
        const handlers = new WalletEventHandlers(eventBus, spike, insightsStore, logger);
        handlers.subscribe();

        await eventBus.emit(
            new TransactionCreated({
                userId: 'test-user-id',
                transactionId: 'tx-1',
                type: 'expense',
                amount: '500',
                currency: 'ARS',
                accountId: 'acc-1',
            }),
        );

        expect(executeFn).toHaveBeenCalledOnce();
    });

    it('does not crash when DetectSpendingSpike throws', async () => {
        const executeFn = vi.fn(async () => {
            throw new Error('spike detection failed');
        });
        const spike = createMockDetectSpendingSpike(executeFn);
        const handlers = new WalletEventHandlers(eventBus, spike, insightsStore, logger);
        handlers.subscribe();

        await expect(
            eventBus.emit(
                new TransactionCreated({
                    userId: 'test-user-id',
                    transactionId: 'tx-1',
                    type: 'expense',
                    amount: '500',
                    currency: 'ARS',
                    accountId: 'acc-1',
                }),
            ),
        ).resolves.toBeDefined();

        expect(executeFn).toHaveBeenCalledOnce();
    });

    it('logs a warning when DetectSpendingSpike throws', async () => {
        const warnSpy = vi.fn();
        const spyLogger = { ...logger, warn: warnSpy } as unknown as typeof logger;

        const executeFn = vi.fn(async () => {
            throw new Error('boom');
        });
        const spike = createMockDetectSpendingSpike(executeFn);
        const handlers = new WalletEventHandlers(eventBus, spike, insightsStore, spyLogger);
        handlers.subscribe();

        await eventBus.emit(
            new TransactionCreated({
                userId: 'test-user-id',
                transactionId: 'tx-1',
                type: 'expense',
                amount: '100',
                currency: 'ARS',
                accountId: 'acc-1',
            }),
        );

        expect(warnSpy).toHaveBeenCalledOnce();
        expect(warnSpy).toHaveBeenCalledWith('DetectSpendingSpike failed', {
            error: 'boom',
        });
    });

    it('does not react to unrelated events', async () => {
        const executeFn = vi.fn(async () => {});
        const spike = createMockDetectSpendingSpike(executeFn);
        const handlers = new WalletEventHandlers(eventBus, spike, insightsStore, logger);
        handlers.subscribe();

        await eventBus.emit({
            domain: 'tasks',
            type: 'task.completed',
            timestamp: new Date(),
            payload: {},
        } as any);

        expect(executeFn).not.toHaveBeenCalled();
    });

    it('handles non-Error thrown values in the catch block', async () => {
        const warnSpy = vi.fn();
        const spyLogger = { ...logger, warn: warnSpy } as unknown as typeof logger;

        const executeFn = vi.fn(async () => {
            throw 'string error';
        });
        const spike = createMockDetectSpendingSpike(executeFn);
        const handlers = new WalletEventHandlers(eventBus, spike, insightsStore, spyLogger);
        handlers.subscribe();

        await eventBus.emit(
            new TransactionCreated({
                userId: 'test-user-id',
                transactionId: 'tx-1',
                type: 'expense',
                amount: '100',
                currency: 'ARS',
                accountId: 'acc-1',
            }),
        );

        expect(warnSpy).toHaveBeenCalledWith('DetectSpendingSpike failed', {
            error: 'string error',
        });
    });

    it('stores a warning insight when a spending spike is emitted', async () => {
        const spike = createMockDetectSpendingSpike();
        const handlers = new WalletEventHandlers(eventBus, spike, insightsStore, logger);
        handlers.subscribe();

        await eventBus.emit(
            new SpendingSpike({
                userId: 'test-user-id',
                totalExpenses: '15000.00',
                previousAverage: '9000.00',
                percentageIncrease: 67,
                currency: 'ARS',
                periodFrom: '2026-04-07',
                periodTo: '2026-04-11',
            }),
        );

        expect(insightsStore.getUnreadInsights('test-user-id')).toEqual([
            expect.objectContaining({
                type: 'warning',
                title: 'Gasto elevado esta semana',
                metadata: expect.objectContaining({
                    source: 'wallet.spending.spike',
                    percentageIncrease: 67,
                }),
            }),
        ]);
    });
});
