import { describe, it, expect, beforeEach } from 'vitest';
import { CheckTasksOverload } from '../../services/CheckTasksOverload';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { createTask } from '../fakes/task-factory';
import type { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

describe('CheckTasksOverload', () => {
    let repo: FakeTaskRepository;
    let eventBus: EventBus;
    let service: CheckTasksOverload;
    let emittedEvents: DomainEvent[];

    const today = new Date().toISOString().slice(0, 10);

    beforeEach(() => {
        repo = new FakeTaskRepository();
        eventBus = new EventBus();
        service = new CheckTasksOverload(repo, eventBus);
        emittedEvents = [];

        eventBus.on('tasks.overloaded', (event) => {
            emittedEvents.push(event);
        });
    });

    it('returns overloaded=false when rate <= 50%', async () => {
        // 10 tasks, 3 carried over = 30%
        const tasks = Array.from({ length: 10 }, (_, i) =>
            createTask({
                scheduledDate: today,
                carryOverCount: i < 3 ? 1 : 0,
            })
        );
        repo.seed(tasks);

        const result = await service.execute(7);

        expect(result.overloaded).toBe(false);
        expect(result.rate).toBe(30);
        expect(emittedEvents).toHaveLength(0);
    });

    it('emits TasksOverloaded when rate > 50% and total >= 5', async () => {
        // 6 tasks, 4 carried over = 66%
        const tasks = Array.from({ length: 6 }, (_, i) =>
            createTask({
                scheduledDate: today,
                carryOverCount: i < 4 ? 1 : 0,
            })
        );
        repo.seed(tasks);

        const result = await service.execute(7);

        expect(result.overloaded).toBe(true);
        expect(result.rate).toBe(67); // Math.round(4/6*100)
        expect(emittedEvents).toHaveLength(1);
        expect(emittedEvents[0].payload).toEqual({
            carryOverRate: 67,
            period: 'last_7_days',
        });
    });

    it('does NOT emit when total < 5 even if rate is high', async () => {
        // 3 tasks, 3 carried over = 100% but total < 5
        repo.seed([
            createTask({ scheduledDate: today, carryOverCount: 1 }),
            createTask({ scheduledDate: today, carryOverCount: 2 }),
            createTask({ scheduledDate: today, carryOverCount: 1 }),
        ]);

        const result = await service.execute(7);

        expect(result.rate).toBe(100);
        expect(result.overloaded).toBe(false); // total < 5
        expect(emittedEvents).toHaveLength(0);
    });
});
