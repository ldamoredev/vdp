import { describe, it, expect, beforeEach } from 'vitest';
import { CheckDailyCompletion } from '../../services/CheckDailyCompletion';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { TaskCompleted } from '../../domain/events/TaskCompleted';
import { createTask } from '../fakes/task-factory';
import type { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

describe('CheckDailyCompletion', () => {
    let repo: FakeTaskRepository;
    let eventBus: EventBus;
    let emittedEvents: DomainEvent[];
    const DATE = '2026-03-18';

    beforeEach(() => {
        repo = new FakeTaskRepository();
        eventBus = new EventBus();
        emittedEvents = [];

        // Register the subscriber
        const subscriber = new CheckDailyCompletion(repo, eventBus);
        subscriber.subscribe();

        // Capture DailyAllCompleted events (not TaskCompleted)
        eventBus.on('tasks.daily.all_completed', (event) => {
            emittedEvents.push(event);
        });
    });

    it('does NOT emit DailyAllCompleted when pending tasks remain', async () => {
        repo.seed([
            createTask({ scheduledDate: DATE, status: 'done' }),
            createTask({ scheduledDate: DATE, status: 'pending' }),
        ]);

        await eventBus.emit(new TaskCompleted({ userId: 'test-user-id', taskId: 'any', scheduledDate: DATE }));

        expect(emittedEvents).toHaveLength(0);
    });

    it('emits DailyAllCompleted when all tasks for the date are done', async () => {
        repo.seed([
            createTask({ scheduledDate: DATE, status: 'done' }),
            createTask({ scheduledDate: DATE, status: 'done' }),
        ]);

        await eventBus.emit(new TaskCompleted({ userId: 'test-user-id', taskId: 'any', scheduledDate: DATE }));

        // Allow async handler to resolve
        await new Promise((r) => setTimeout(r, 10));

        expect(emittedEvents).toHaveLength(1);
        expect(emittedEvents[0].payload).toEqual({
            userId: 'test-user-id',
            date: DATE,
            count: 2,
        });
    });

    it('does NOT emit when there are zero tasks', async () => {
        // No tasks seeded for this date

        await eventBus.emit(new TaskCompleted({ userId: 'test-user-id', taskId: 'any', scheduledDate: DATE }));

        await new Promise((r) => setTimeout(r, 10));

        expect(emittedEvents).toHaveLength(0);
    });
});
