import { describe, it, expect, beforeEach } from 'vitest';
import { GetDayStats } from '../../services/GetDayStats';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';
import { todayISO, localDateISO } from '../../../common/base/time/dates';

describe('GetDayStats', () => {
    const userId = 'test-user-id';
    let repo: FakeTaskRepository;
    let service: GetDayStats;
    const DATE = '2026-03-18';

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new GetDayStats(repo);
    });

    it('returns zeroed stats for empty day', async () => {
        const stats = await service.execute(userId, DATE);

        expect(stats.date).toBe(DATE);
        expect(stats.total).toBe(0);
        expect(stats.completionRate).toBe(0);
    });

    it('computes correct stats', async () => {
        repo.seed([
            createTask({ scheduledDate: DATE, status: 'done' }),
            createTask({ scheduledDate: DATE, status: 'done' }),
            createTask({ scheduledDate: DATE, status: 'pending' }),
            createTask({ scheduledDate: DATE, status: 'pending', carryOverCount: 2 }),
        ]);

        const stats = await service.execute(userId, DATE);

        expect(stats.total).toBe(4);
        expect(stats.completed).toBe(2);
        expect(stats.pending).toBe(2);
        expect(stats.carriedOver).toBe(1);
        expect(stats.completionRate).toBe(50);
    });

    it('executeToday uses current date', async () => {
        const today = todayISO();
        repo.seed([createTask({ scheduledDate: today, status: 'done' })]);

        const stats = await service.executeToday(userId);
        expect(stats.date).toBe(today);
        expect(stats.completed).toBe(1);
    });

    it('executeTrend returns stats for N days', async () => {
        const today = new Date();
        for (let i = 0; i < 3; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = localDateISO(d);
            repo.seed([createTask({ scheduledDate: dateStr, status: 'done' })]);
        }

        const trend = await service.executeTrend(userId, 3);

        expect(trend).toHaveLength(3);
        trend.forEach((stats) => {
            expect(stats.completed).toBeGreaterThanOrEqual(1);
        });
    });
});
