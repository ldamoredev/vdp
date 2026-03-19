import { Task } from '../../domain/Task';
import { todayISO } from '../../../common/base/utils/dates';
import {
    TaskRepository,
    PagedTasks,
    TaskFilters,
    CreateTaskData,
    UpdateTaskData,
    DomainStat,
    CarryOverStats,
} from '../../domain/TaskRepository';
import { Database } from '../../../common/base/db/Database';
import { tasks } from './schema';
import { and, asc, desc, eq, gte, lte, sql, SQL } from 'drizzle-orm';

export class DrizzleTaskRepository extends TaskRepository {
    constructor(private db: Database) {
        super();
    }

    // ─── CRUD ────────────────────────────────────────────

    async getTask(id: string): Promise<Task | null> {
        const result = await this.db.query.select().from(tasks).where(eq(tasks.id, id));
        if (!result[0]) return null;
        return Task.fromSnapshot(result[0]);
    }

    async listTasks(filters: TaskFilters): Promise<PagedTasks> {
        const conditions: SQL[] = [];
        if (filters.scheduledDate)
            conditions.push(eq(tasks.scheduledDate, filters.scheduledDate));
        if (filters.status)
            conditions.push(eq(tasks.status, filters.status));
        if (filters.domain)
            conditions.push(eq(tasks.domain, filters.domain));
        if (filters.priority)
            conditions.push(eq(tasks.priority, filters.priority));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;

        const [data, countResult] = await Promise.all([
            this.db.query
                .select()
                .from(tasks)
                .where(whereClause)
                .orderBy(desc(tasks.priority), asc(tasks.createdAt))
                .limit(limit)
                .offset(offset),
            this.db.query
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(whereClause),
        ]);

        return {
            tasks: data.map(s => Task.fromSnapshot(s)),
            total: countResult[0].count,
            limit,
            offset,
        };
    }

    async createTask(data: CreateTaskData): Promise<Task> {
        const scheduledDate = data.scheduledDate || todayISO();

        const [row] = await this.db.query
            .insert(tasks)
            .values({
                title: data.title,
                description: data.description || null,
                priority: data.priority ?? 2,
                scheduledDate,
                domain: data.domain || null,
            })
            .returning();

        return Task.fromSnapshot(row);
    }

    async updateTask(id: string, data: UpdateTaskData): Promise<Task | null> {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        for (const [k, v] of Object.entries(data)) {
            if (v !== undefined) updateData[k] = v;
        }

        const [updated] = await this.db.query
            .update(tasks)
            .set(updateData)
            .where(eq(tasks.id, id))
            .returning();

        if (!updated) return null;
        return Task.fromSnapshot(updated);
    }

    async deleteTask(id: string): Promise<Task | null> {
        const [deleted] = await this.db.query
            .delete(tasks)
            .where(eq(tasks.id, id))
            .returning();

        if (!deleted) return null;
        return Task.fromSnapshot(deleted);
    }

    // ─── Persistence (save entity state) ─────────────────

    async save(task: Task): Promise<Task> {
        const { id, createdAt, ...data } = task.toSnapshot();
        const [updated] = await this.db.query
            .update(tasks)
            .set(data)
            .where(eq(tasks.id, id))
            .returning();

        return Task.fromSnapshot(updated);
    }

    // ─── Queries ─────────────────────────────────────────

    async getTasksByDateAndStatus(date: string, status: string): Promise<Task[]> {
        const rows = await this.db.query
            .select()
            .from(tasks)
            .where(and(eq(tasks.scheduledDate, date), eq(tasks.status, status)));

        return rows.map(s => Task.fromSnapshot(s));
    }

    async getTasksByDate(date: string): Promise<Task[]> {
        const rows = await this.db.query
            .select()
            .from(tasks)
            .where(eq(tasks.scheduledDate, date))
            .orderBy(desc(tasks.priority), asc(tasks.createdAt));

        return rows.map(s => Task.fromSnapshot(s));
    }

    async countByDateAndStatus(date: string, status: string): Promise<number> {
        const result = await this.db.query
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(tasks)
            .where(and(eq(tasks.scheduledDate, date), eq(tasks.status, status)));

        return result[0].count;
    }

    // ─── Stats ───────────────────────────────────────────

    async getCompletionByDomain(from?: string, to?: string): Promise<DomainStat[]> {
        const conditions: SQL[] = [eq(tasks.status, "done")];
        if (from) conditions.push(gte(tasks.scheduledDate, from));
        if (to) conditions.push(lte(tasks.scheduledDate, to));

        return this.db.query
            .select({
                domain: tasks.domain,
                count: sql<number>`COUNT(*)::int`,
            })
            .from(tasks)
            .where(and(...conditions))
            .groupBy(tasks.domain);
    }

    async getCarryOverStats(fromDate: string, toDate: string): Promise<CarryOverStats> {
        const result = await this.db.query
            .select({
                total: sql<number>`COUNT(*)::int`,
                carriedOver: sql<number>`COUNT(*) FILTER (WHERE ${tasks.carryOverCount} > 0)::int`,
            })
            .from(tasks)
            .where(and(gte(tasks.scheduledDate, fromDate), lte(tasks.scheduledDate, toDate)));

        return { total: result[0].total, carriedOver: result[0].carriedOver };
    }
}
