import { describe, it, expect, beforeEach } from 'vitest';
import { CheckTasksOverload } from '../../services/CheckTasksOverload';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { createTask } from '../fakes/task-factory';
import type { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { todayISO, localDateISO } from '../../../common/base/time/dates';

describe('CheckTasksOverload', () => {
    let repo: FakeTaskRepository;
    let eventBus: EventBus;
    let service: CheckTasksOverload;
    let emittedEvents: DomainEvent[];

    const today = todayISO();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = localDateISO(yesterdayDate);

    beforeEach(() => {
        repo = new FakeTaskRepository();
        eventBus = new EventBus();
        service = new CheckTasksOverload(repo, eventBus);
        emittedEvents = [];

        eventBus.on('tasks.overloaded', (event) => {
            emittedEvents.push(event);
        });
    });

    it('returns overloaded=false when current load is below threshold', async () => {
        // Baseline: 7 tasks yesterday, all done. Avg = 1. Threshold = max(3, 1*1.5) = 3.
        const historical = Array.from({ length: 7 }, () =>
            createTask({ scheduledDate: yesterday, status: 'done' })
        );
        repo.seed(historical);

        // Current: 3 pending today. Not overloaded (since 3 <= 3).
        const current = Array.from({ length: 3 }, () =>
            createTask({ scheduledDate: today, status: 'pending' })
        );
        repo.seed(current);

        const result = await service.execute(7);

        expect(result.overloaded).toBe(false);
        expect(result.threshold).toBe(3);
        expect(emittedEvents).toHaveLength(0);
    });

    it('emits TasksOverloaded when current load exceeds threshold', async () => {
        // Baseline: 7 tasks yesterday, all done. Avg = 1. Threshold = 3.
        const historical = Array.from({ length: 7 }, () =>
            createTask({ scheduledDate: yesterday, status: 'done' })
        );
        repo.seed(historical);

        // Current: 5 pending today. Overloaded (5 > 3).
        const current = Array.from({ length: 5 }, () =>
            createTask({ scheduledDate: today, status: 'pending' })
        );
        repo.seed(current);

        const result = await service.execute(7);

        expect(result.overloaded).toBe(true);
        expect(result.threshold).toBe(3);
        expect(emittedEvents).toHaveLength(1);
        expect(emittedEvents[0].payload).toMatchObject({
            currentLoad: 5,
            threshold: 3,
        });
    });

    it('reduces threshold if historical carry-over rate is high', async () => {
        // Baseline: 7 tasks yesterday, 6 carried over. Rate = 85%.
        // Avg completion = 1/7 = 0.14. Threshold = max(3, 0.14*1.5) = 3.
        // Penalty: 3 * 0.8 = 2.4 -> ceil = 3. 
        // Wait, let's use bigger numbers to see the penalty.
        // Baseline: 70 tasks, 60 carried over. Rate = 86%.
        // Avg completion = 10/7 = 1.4. Threshold = ceil(1.4*1.5) = ceil(2.1) = 3.
        // Penalty: threshold = ceil(3 * 0.8) = 3. (Still 3 because of max(3, ...))
        
        // Let's use 20 done tasks per day.
        // Baseline: 140 tasks, 0 carried over. Avg = 20. Threshold = ceil(20*1.5) = 30.
        // If rate > 40%: 30 * 0.8 = 24.
        
        const historical = [
            ...Array.from({ length: 70 }, () => createTask({ scheduledDate: yesterday, status: 'done', carryOverCount: 0 })),
            ...Array.from({ length: 70 }, () => createTask({ scheduledDate: yesterday, status: 'pending', carryOverCount: 1 })),
        ];
        repo.seed(historical);

        const result = await service.execute(7);

        // Avg completion = 70/7 = 10.
        // Base threshold = ceil(10 * 1.5) = 15.
        // Rate = 50% (> 40%).
        // Penalty: ceil(15 * 0.8) = 12.
        expect(result.threshold).toBe(12);
    });
});
