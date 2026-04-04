import { Task, type TaskSnapshot, type TaskStatus } from '../../domain/Task';
import { todayISO } from '../../../common/base/time/dates';
import {
    TaskRepository,
    type TaskFilters,
    type PagedTasks,
    type CreateTaskData,
    type UpdateTaskData,
    type DomainStat,
    type CarryOverStats,
    type DateCounts,
    type DateTrendRow,
} from '../../domain/TaskRepository';
import { randomUUID } from 'crypto';

export class FakeTaskRepository extends TaskRepository {
    private store = new Map<string, TaskSnapshot>();

    // ─── Test helpers ──────────────────────────────────

    seed(tasks: Task[]): void {
        for (const task of tasks) {
            this.store.set(task.id, task.toSnapshot());
        }
    }

    clear(): void {
        this.store.clear();
    }

    get size(): number {
        return this.store.size;
    }

    // ─── CRUD ──────────────────────────────────────────

    async getTask(_userId: string, id: string): Promise<Task | null> {
        const snapshot = this.store.get(id);
        return snapshot ? Task.fromSnapshot(snapshot) : null;
    }

    async getTasksByIds(_userId: string, ids: string[]): Promise<Task[]> {
        return ids
            .map(id => this.store.get(id))
            .filter((s): s is TaskSnapshot => s !== undefined)
            .map(Task.fromSnapshot);
    }

    async listTasks(_userId: string, filters: TaskFilters): Promise<PagedTasks> {
        let tasks = Array.from(this.store.values()).map(Task.fromSnapshot);

        if (filters.scheduledDate) tasks = tasks.filter(t => t.scheduledDate === filters.scheduledDate);
        if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
        if (filters.domain) tasks = tasks.filter(t => t.domain === filters.domain);
        if (filters.priority !== undefined) tasks = tasks.filter(t => t.priority === filters.priority);

        const total = tasks.length;
        const offset = filters.offset ?? 0;
        const limit = filters.limit ?? 50;

        return {
            tasks: tasks.slice(offset, offset + limit),
            total,
            limit,
            offset,
        };
    }

    async createTask(_userId: string, data: CreateTaskData): Promise<Task> {
        const now = new Date();
        const task = new Task(
            randomUUID(),
            now,
            data.description ?? null,
            now,
            null,
            data.title,
            "pending",
            data.priority ?? 2,
            data.scheduledDate ?? todayISO(),
            data.domain ?? null,
            0,
        );
        this.store.set(task.id, task.toSnapshot());
        return task;
    }

    async updateTask(_userId: string, id: string, data: UpdateTaskData): Promise<Task | null> {
        const snapshot = this.store.get(id);
        if (!snapshot) return null;

        const task = Task.fromSnapshot(snapshot);
        if (data.title !== undefined) task.title = data.title;
        if (data.description !== undefined) task.description = data.description;
        if (data.priority !== undefined) task.priority = data.priority;
        if (data.scheduledDate !== undefined) task.scheduledDate = data.scheduledDate;
        if (data.domain !== undefined) task.domain = data.domain;
        task.updatedAt = new Date();

        this.store.set(id, task.toSnapshot());
        return task;
    }

    async deleteTask(_userId: string, id: string): Promise<Task | null> {
        const snapshot = this.store.get(id);
        if (!snapshot) return null;

        this.store.delete(id);
        return Task.fromSnapshot(snapshot);
    }

    async save(_userId: string, task: Task): Promise<Task> {
        this.store.set(task.id, task.toSnapshot());
        return task;
    }

    // ─── Queries ───────────────────────────────────────

    async getTasksByDateAndStatus(_userId: string, date: string, status: TaskStatus): Promise<Task[]> {
        return Array.from(this.store.values())
            .filter(s => s.scheduledDate === date && s.status === status)
            .map(Task.fromSnapshot);
    }

    async getTasksByDate(_userId: string, date: string): Promise<Task[]> {
        return Array.from(this.store.values())
            .filter(s => s.scheduledDate === date)
            .map(Task.fromSnapshot);
    }

    async countByDateAndStatus(_userId: string, date: string, status: TaskStatus): Promise<number> {
        return Array.from(this.store.values())
            .filter(s => s.scheduledDate === date && s.status === status)
            .length;
    }

    async countByDate(_userId: string, date: string): Promise<DateCounts> {
        const all = Array.from(this.store.values()).filter(s => s.scheduledDate === date);
        return {
            pending: all.filter(s => s.status === 'pending').length,
            done: all.filter(s => s.status === 'done').length,
            discarded: all.filter(s => s.status === 'discarded').length,
            total: all.length,
        };
    }

    async getTrendByDateRange(_userId: string, fromDate: string, toDate: string): Promise<DateTrendRow[]> {
        const all = Array.from(this.store.values())
            .filter(s => s.scheduledDate >= fromDate && s.scheduledDate <= toDate);

        const byDate = new Map<string, DateTrendRow>();
        for (const s of all) {
            const existing = byDate.get(s.scheduledDate) ?? {
                date: s.scheduledDate,
                total: 0,
                completed: 0,
                pending: 0,
                discarded: 0,
                carriedOver: 0,
            };
            existing.total++;
            if (s.status === 'done') existing.completed++;
            if (s.status === 'pending') existing.pending++;
            if (s.status === 'discarded') existing.discarded++;
            if (s.carryOverCount > 0) existing.carriedOver++;
            byDate.set(s.scheduledDate, existing);
        }

        return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
    }

    // ─── Stats ─────────────────────────────────────────

    async getCompletionByDomain(_userId: string, from?: string, to?: string): Promise<DomainStat[]> {
        const tasks = Array.from(this.store.values())
            .filter(s => s.status === "done")
            .filter(s => {
                if (from && s.scheduledDate < from) return false;
                if (to && s.scheduledDate > to) return false;
                return true;
            });

        const counts = new Map<string | null, number>();
        for (const t of tasks) {
            counts.set(t.domain, (counts.get(t.domain) ?? 0) + 1);
        }

        return Array.from(counts.entries()).map(([domain, count]) => ({ domain, count }));
    }

    async getCarryOverStats(_userId: string, fromDate: string, toDate: string): Promise<CarryOverStats> {
        const tasks = Array.from(this.store.values())
            .filter(s => s.scheduledDate >= fromDate && s.scheduledDate <= toDate);

        const total = tasks.length;
        const carriedOver = tasks.filter(s => s.carryOverCount > 0).length;

        return { total, carriedOver };
    }
}
