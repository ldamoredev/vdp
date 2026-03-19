import { describe, it, expect, beforeEach } from 'vitest';
import { DrizzleTaskRepository } from '../../infrastructure/db/DrizzleTaskRepository';
import { testDb } from './test-database';

const repo = new DrizzleTaskRepository(testDb as any);

beforeEach(async () => {
    await testDb.truncate();
});

describe('DrizzleTaskRepository', () => {

    // ─── CRUD ──────────────────────────────────────────

    describe('createTask', () => {
        it('creates a task with defaults', async () => {
            const task = await repo.createTask({ title: 'Buy milk' });

            expect(task.id).toBeDefined();
            expect(task.title).toBe('Buy milk');
            expect(task.status).toBe('pending');
            expect(task.priority).toBe(2);
            expect(task.carryOverCount).toBe(0);
        });

        it('creates a task with all fields', async () => {
            const task = await repo.createTask({
                title: 'Workout',
                description: 'Leg day',
                priority: 3,
                scheduledDate: '2026-03-20',
                domain: 'health',
            });

            expect(task.title).toBe('Workout');
            expect(task.description).toBe('Leg day');
            expect(task.priority).toBe(3);
            expect(task.scheduledDate).toBe('2026-03-20');
            expect(task.domain).toBe('health');
        });
    });

    describe('getTask', () => {
        it('returns null for nonexistent id', async () => {
            const result = await repo.getTask('00000000-0000-0000-0000-000000000000');
            expect(result).toBeNull();
        });

        it('returns the task by id', async () => {
            const created = await repo.createTask({ title: 'Find me' });
            const found = await repo.getTask(created.id);

            expect(found).not.toBeNull();
            expect(found!.id).toBe(created.id);
            expect(found!.title).toBe('Find me');
        });
    });

    describe('updateTask', () => {
        it('returns null for nonexistent id', async () => {
            const result = await repo.updateTask('00000000-0000-0000-0000-000000000000', { title: 'X' });
            expect(result).toBeNull();
        });

        it('updates specified fields only', async () => {
            const created = await repo.createTask({ title: 'Old', priority: 1 });
            const updated = await repo.updateTask(created.id, { title: 'New' });

            expect(updated!.title).toBe('New');
            expect(updated!.priority).toBe(1); // unchanged
        });
    });

    describe('deleteTask', () => {
        it('returns null for nonexistent id', async () => {
            const result = await repo.deleteTask('00000000-0000-0000-0000-000000000000');
            expect(result).toBeNull();
        });

        it('deletes and returns the task', async () => {
            const created = await repo.createTask({ title: 'Delete me' });
            const deleted = await repo.deleteTask(created.id);

            expect(deleted!.title).toBe('Delete me');

            const found = await repo.getTask(created.id);
            expect(found).toBeNull();
        });
    });

    // ─── save() ────────────────────────────────────────

    describe('save', () => {
        it('persists entity state changes', async () => {
            const task = await repo.createTask({ title: 'Complete me' });
            task.complete();
            await repo.save(task);

            const found = await repo.getTask(task.id);
            expect(found!.status).toBe('done');
            expect(found!.completedAt).toBeInstanceOf(Date);
        });
    });

    // ─── listTasks ─────────────────────────────────────

    describe('listTasks', () => {
        it('returns empty list when no tasks', async () => {
            const result = await repo.listTasks({});
            expect(result.tasks).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('filters by scheduledDate', async () => {
            await repo.createTask({ title: 'A', scheduledDate: '2026-03-18' });
            await repo.createTask({ title: 'B', scheduledDate: '2026-03-19' });

            const result = await repo.listTasks({ scheduledDate: '2026-03-18' });
            expect(result.tasks).toHaveLength(1);
            expect(result.tasks[0].title).toBe('A');
        });

        it('filters by status', async () => {
            const t = await repo.createTask({ title: 'Done' });
            t.complete();
            await repo.save(t);
            await repo.createTask({ title: 'Pending' });

            const result = await repo.listTasks({ status: 'done' });
            expect(result.tasks).toHaveLength(1);
            expect(result.tasks[0].title).toBe('Done');
        });

        it('orders by priority desc, createdAt asc', async () => {
            await repo.createTask({ title: 'Low', priority: 1 });
            await repo.createTask({ title: 'High', priority: 3 });
            await repo.createTask({ title: 'Medium', priority: 2 });

            const result = await repo.listTasks({});
            expect(result.tasks.map(t => t.title)).toEqual(['High', 'Medium', 'Low']);
        });

        it('applies limit and offset', async () => {
            for (let i = 0; i < 5; i++) {
                await repo.createTask({ title: `Task ${i}`, priority: 2 });
            }

            const result = await repo.listTasks({ limit: 2, offset: 1 });
            expect(result.tasks).toHaveLength(2);
            expect(result.total).toBe(5);
        });
    });

    // ─── Queries ───────────────────────────────────────

    describe('getTasksByDate', () => {
        it('returns tasks for the given date', async () => {
            await repo.createTask({ title: 'A', scheduledDate: '2026-03-18' });
            await repo.createTask({ title: 'B', scheduledDate: '2026-03-18' });
            await repo.createTask({ title: 'C', scheduledDate: '2026-03-19' });

            const tasks = await repo.getTasksByDate('2026-03-18');
            expect(tasks).toHaveLength(2);
        });
    });

    describe('getTasksByDateAndStatus', () => {
        it('filters by date AND status', async () => {
            const t = await repo.createTask({ title: 'Done', scheduledDate: '2026-03-18' });
            t.complete();
            await repo.save(t);
            await repo.createTask({ title: 'Pending', scheduledDate: '2026-03-18' });

            const tasks = await repo.getTasksByDateAndStatus('2026-03-18', 'done');
            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toBe('Done');
        });
    });

    describe('countByDateAndStatus', () => {
        it('returns correct count', async () => {
            await repo.createTask({ title: 'A', scheduledDate: '2026-03-18' });
            await repo.createTask({ title: 'B', scheduledDate: '2026-03-18' });

            const count = await repo.countByDateAndStatus('2026-03-18', 'pending');
            expect(count).toBe(2);
        });

        it('returns 0 when no match', async () => {
            const count = await repo.countByDateAndStatus('2026-03-18', 'done');
            expect(count).toBe(0);
        });
    });

    // ─── Stats ─────────────────────────────────────────

    describe('getCompletionByDomain', () => {
        it('groups completed tasks by domain', async () => {
            const t1 = await repo.createTask({ title: 'W1', domain: 'work', scheduledDate: '2026-03-18' });
            const t2 = await repo.createTask({ title: 'W2', domain: 'work', scheduledDate: '2026-03-18' });
            const t3 = await repo.createTask({ title: 'H1', domain: 'health', scheduledDate: '2026-03-18' });

            for (const t of [t1, t2, t3]) {
                t.complete();
                await repo.save(t);
            }

            const stats = await repo.getCompletionByDomain();
            const workStat = stats.find(s => s.domain === 'work');
            const healthStat = stats.find(s => s.domain === 'health');

            expect(workStat?.count).toBe(2);
            expect(healthStat?.count).toBe(1);
        });

        it('filters by date range', async () => {
            const t1 = await repo.createTask({ title: 'In range', domain: 'work', scheduledDate: '2026-03-18' });
            const t2 = await repo.createTask({ title: 'Out of range', domain: 'work', scheduledDate: '2026-03-10' });

            for (const t of [t1, t2]) {
                t.complete();
                await repo.save(t);
            }

            const stats = await repo.getCompletionByDomain('2026-03-15', '2026-03-20');
            expect(stats).toHaveLength(1);
            expect(stats[0].count).toBe(1);
        });
    });

    describe('getCarryOverStats', () => {
        it('counts total and carried-over tasks in range', async () => {
            await repo.createTask({ title: 'Normal', scheduledDate: '2026-03-18' });

            const carried = await repo.createTask({ title: 'Carried', scheduledDate: '2026-03-18' });
            carried.carryOver('2026-03-19');
            await repo.save(carried);

            // After carryOver, scheduledDate changed to 2026-03-19
            // So we need to query the right range
            const stats = await repo.getCarryOverStats('2026-03-18', '2026-03-19');
            expect(stats.total).toBe(2);
            expect(stats.carriedOver).toBe(1);
        });
    });
});
