import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { CrossDomainEventHandlers } from '../../services/CrossDomainEventHandlers';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { CreateTask } from '../../services/CreateTask';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { SpendingSpike } from '../../../wallet/domain/events/SpendingSpike';
import { todayISO } from '../../../common/base/time/dates';

function createMockCreateTask(): CreateTask {
    return {
        execute: vi.fn().mockResolvedValue({ task: { id: 'generated-id', title: 'test' } }),
    } as unknown as CreateTask;
}

describe('CrossDomainEventHandlers', () => {
    let eventBus: EventBus;
    let insightsStore: TaskInsightsStore;
    let createTask: ReturnType<typeof createMockCreateTask>;
    let handler: CrossDomainEventHandlers;
    const logger = new NoOpLogger();

    beforeEach(() => {
        eventBus = new EventBus();
        insightsStore = new TaskInsightsStore();
        createTask = createMockCreateTask();
        handler = new CrossDomainEventHandlers(eventBus, insightsStore, createTask, logger);
        handler.subscribe();
    });

    it('creates an insight on spending spike', async () => {
        const addSpy = vi.spyOn(insightsStore, 'addInsight');

        await eventBus.emit(new SpendingSpike({
            userId: 'test-user-id',
            totalExpenses: '500.00',
            previousAverage: '250.00',
            percentageIncrease: 100,
            currency: 'ARS',
            periodFrom: '2026-03-24',
            periodTo: '2026-03-30',
        }));

        expect(addSpy).toHaveBeenCalledOnce();
        expect(addSpy.mock.calls[0][0]).toMatchObject({
            userId: 'test-user-id',
            type: 'warning',
            title: 'Gasto elevado esta semana',
        });
    });

    it('includes a wallet drill-down action in the spending spike insight metadata', async () => {
        const addSpy = vi.spyOn(insightsStore, 'addInsight');

        await eventBus.emit(new SpendingSpike({
            userId: 'test-user-id',
            totalExpenses: '750.00',
            previousAverage: '300.00',
            percentageIncrease: 150,
            currency: 'ARS',
            periodFrom: '2026-03-30',
            periodTo: '2026-04-05',
        }));

        const metadata = addSpy.mock.calls[0][0].metadata as Record<string, unknown>;
        expect(metadata.actionHref).toBe('/wallet/transactions?from=2026-03-30&to=2026-04-05');
        expect(metadata.actionLabel).toBe('Revisar movimientos');
        expect(metadata.source).toBe('wallet.spending.spike');
        expect(metadata.periodFrom).toBe('2026-03-30');
        expect(metadata.periodTo).toBe('2026-04-05');
    });

    it('creates a task on spending spike', async () => {
        await eventBus.emit(new SpendingSpike({
            userId: 'test-user-id',
            totalExpenses: '500.00',
            previousAverage: '250.00',
            percentageIncrease: 100,
            currency: 'ARS',
            periodFrom: '2026-03-24',
            periodTo: '2026-03-30',
        }));

        expect(createTask.execute).toHaveBeenCalledOnce();

        const taskData = (createTask.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
        expect(taskData.title).toContain('Revisar gasto semanal');
        expect(taskData.title).toContain('100%');
        expect(taskData.domain).toBe('finanzas');
        expect(taskData.priority).toBe(3);
        expect(taskData.scheduledDate).toBe(todayISO());
    });

    it('includes expense details in task description', async () => {
        await eventBus.emit(new SpendingSpike({
            userId: 'test-user-id',
            totalExpenses: '750.00',
            previousAverage: '300.00',
            percentageIncrease: 150,
            currency: 'USD',
            periodFrom: '2026-03-24',
            periodTo: '2026-03-30',
        }));

        const taskData = (createTask.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
        expect(taskData.description).toContain('$750.00');
        expect(taskData.description).toContain('$300.00');
        expect(taskData.description).toContain('USD');
    });

    it('logs error but does not throw when task creation fails', async () => {
        (createTask.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('DB down'));

        await expect(
            eventBus.emit(new SpendingSpike({
                userId: 'test-user-id',
                totalExpenses: '500.00',
                previousAverage: '250.00',
                percentageIncrease: 100,
                currency: 'ARS',
                periodFrom: '2026-03-24',
                periodTo: '2026-03-30',
            })),
        ).resolves.toBeDefined();
    });

    it('still creates insight even when task creation fails', async () => {
        (createTask.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('DB down'));
        const addSpy = vi.spyOn(insightsStore, 'addInsight');

        await eventBus.emit(new SpendingSpike({
            userId: 'test-user-id',
            totalExpenses: '500.00',
            previousAverage: '250.00',
            percentageIncrease: 100,
            currency: 'ARS',
            periodFrom: '2026-03-24',
            periodTo: '2026-03-30',
        }));

        expect(addSpy).toHaveBeenCalledOnce();
    });

    it('does not react to unrelated events', async () => {
        const addSpy = vi.spyOn(insightsStore, 'addInsight');

        await eventBus.emit({
            id: 'evt-1',
            domain: 'wallet',
            type: 'transaction.created',
            payload: {},
            timestamp: new Date(),
        });

        expect(addSpy).not.toHaveBeenCalled();
        expect(createTask.execute).not.toHaveBeenCalled();
    });
});
