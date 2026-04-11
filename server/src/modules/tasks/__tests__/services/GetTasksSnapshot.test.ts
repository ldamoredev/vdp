import { describe, it, expect } from 'vitest';
import { todayISO } from '../../../common/base/time/dates';
import { createTask } from '../fakes/task-factory';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import type { TasksSnapshot } from '../../services/GetTasksSnapshot';
import { GetTasksSnapshot } from '../../services/GetTasksSnapshot';

describe('GetTasksSnapshot', () => {
    function createService() {
        const tasks = new FakeTaskRepository();

        return {
            service: new GetTasksSnapshot(tasks),
            tasks,
        };
    }

    it('returns an empty snapshot when no tasks exist for today', async () => {
        const { service } = createService();

        const result = await service.execute('user-1');

        expect(result).toEqual<TasksSnapshot>({
            pendingCount: 0,
            completedCount: 0,
            totalCount: 0,
            completionRate: 0,
            stuckTasks: [],
        });
    });

    it('calculates today completion metrics from pending and done tasks', async () => {
        const { service, tasks } = createService();
        const today = todayISO();

        tasks.seed([
            createTask({ id: 'task-done', title: 'Done task', status: 'done', scheduledDate: today }),
            createTask({ id: 'task-pending', title: 'Pending task', status: 'pending', scheduledDate: today }),
            createTask({ id: 'task-old', title: 'Old task', status: 'done', scheduledDate: '2026-01-01' }),
        ]);

        const result = await service.execute('user-1');

        expect(result).toEqual<TasksSnapshot>({
            pendingCount: 1,
            completedCount: 1,
            totalCount: 2,
            completionRate: 50,
            stuckTasks: [],
        });
    });

    it('includes pending tasks carried over three or more times as stuck tasks', async () => {
        const { service, tasks } = createService();
        const today = todayISO();

        tasks.seed([
            createTask({
                id: 'task-stuck',
                title: 'Stuck task',
                status: 'pending',
                scheduledDate: today,
                carryOverCount: 4,
            }),
            createTask({
                id: 'task-fresh',
                title: 'Fresh task',
                status: 'pending',
                scheduledDate: today,
                carryOverCount: 1,
            }),
        ]);

        const result = await service.execute('user-1');

        expect(result.stuckTasks).toEqual([
            { title: 'Stuck task', carryOverCount: 4 },
        ]);
    });
});
