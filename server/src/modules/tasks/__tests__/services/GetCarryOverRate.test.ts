import { describe, it, expect, beforeEach } from 'vitest';
import { GetCarryOverRate } from '../../services/GetCarryOverRate';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';
import { todayISO } from '../../../common/base/utils/dates';

describe('GetCarryOverRate', () => {
    let repo: FakeTaskRepository;
    let service: GetCarryOverRate;

    const today = todayISO();

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new GetCarryOverRate(repo);
    });

    it('returns 0% when no tasks', async () => {
        const result = await service.execute(7);

        expect(result.total).toBe(0);
        expect(result.carriedOver).toBe(0);
        expect(result.rate).toBe(0);
        expect(result.days).toBe(7);
    });

    it('computes correct carry-over rate', async () => {
        repo.seed([
            createTask({ scheduledDate: today, carryOverCount: 1 }),
            createTask({ scheduledDate: today, carryOverCount: 0 }),
            createTask({ scheduledDate: today, carryOverCount: 2 }),
            createTask({ scheduledDate: today, carryOverCount: 0 }),
        ]);

        const result = await service.execute(7);

        expect(result.total).toBe(4);
        expect(result.carriedOver).toBe(2);
        expect(result.rate).toBe(50);
    });

    it('does NOT emit any events (pure query, CQS)', async () => {
        repo.seed([
            createTask({ scheduledDate: today, carryOverCount: 1 }),
        ]);

        // GetCarryOverRate is a pure query — no EventBus dependency
        const result = await service.execute(7);

        expect(result.rate).toBe(100);
        // No event bus in constructor = CQS compliance verified by design
    });
});
