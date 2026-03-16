import { db } from "../../core/db/client.js";
import { tasks, taskNotes } from "./schema.js";
import { tasksEvents } from "./events.js";
import { eq, and, gte, lte, desc, asc, sql, type SQL } from "drizzle-orm";

class TasksService {
  // ─── Tasks CRUD ──────────────────────────────────────────

  async listTasks(filters: {
    scheduledDate?: string;
    status?: string;
    domain?: string;
    priority?: number;
    limit?: number;
    offset?: number;
  }) {
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
      db
        .select()
        .from(tasks)
        .where(whereClause)
        .orderBy(desc(tasks.priority), asc(tasks.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(whereClause),
    ]);

    return { data, total: countResult[0].count, limit, offset };
  }

  async getTask(id: string) {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0] ?? null;
  }

  async getTaskWithNotes(id: string) {
    const task = await this.getTask(id);
    if (!task) return null;

    const notes = await db
      .select()
      .from(taskNotes)
      .where(eq(taskNotes.taskId, id))
      .orderBy(asc(taskNotes.createdAt));

    return { ...task, notes };
  }

  async createTask(data: {
    title: string;
    description?: string | null;
    priority?: number;
    scheduledDate?: string;
    domain?: string | null;
  }) {
    const scheduledDate = data.scheduledDate || new Date().toISOString().slice(0, 10);

    const [task] = await db
      .insert(tasks)
      .values({
        title: data.title,
        description: data.description || null,
        priority: data.priority ?? 2,
        scheduledDate,
        domain: data.domain || null,
      })
      .returning();

    return task;
  }

  async updateTask(id: string, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) updateData[k] = v;
    }

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteTask(id: string) {
    // Delete notes first (FK constraint)
    await db.delete(taskNotes).where(eq(taskNotes.taskId, id));
    const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return deleted ?? null;
  }

  // ─── Status Transitions ──────────────────────────────────

  async completeTask(id: string) {
    const [updated] = await db
      .update(tasks)
      .set({
        status: "done",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) return null;

    // Check if all tasks for this day are now done
    await this.checkDailyCompletion(updated.scheduledDate);

    return updated;
  }

  async carryOverTask(id: string, toDate?: string) {
    const targetDate = toDate || this.tomorrow();

    const task = await this.getTask(id);
    if (!task) return null;

    const newCarryOverCount = task.carryOverCount + 1;

    const [updated] = await db
      .update(tasks)
      .set({
        status: "pending",
        scheduledDate: targetDate,
        carryOverCount: newCarryOverCount,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    // Emit stuck event if carried over 3+ times
    if (updated && newCarryOverCount >= 3) {
      await tasksEvents.taskStuck({
        taskId: updated.id,
        title: updated.title,
        carryOverCount: newCarryOverCount,
      });
    }

    return updated;
  }

  async discardTask(id: string) {
    const [updated] = await db
      .update(tasks)
      .set({
        status: "discarded",
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    return updated ?? null;
  }

  // ─── Bulk Operations (end-of-day review) ─────────────────

  async carryOverAllPending(fromDate: string, toDate?: string) {
    const targetDate = toDate || this.tomorrow();

    const pendingTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.scheduledDate, fromDate),
          eq(tasks.status, "pending")
        )
      );

    const results = [];
    for (const task of pendingTasks) {
      const carried = await this.carryOverTask(task.id, targetDate);
      if (carried) results.push(carried);
    }

    return results;
  }

  async getEndOfDayReview(date?: string) {
    const reviewDate = date || new Date().toISOString().slice(0, 10);

    const dayTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.scheduledDate, reviewDate))
      .orderBy(desc(tasks.priority), asc(tasks.createdAt));

    const completed = dayTasks.filter((t) => t.status === "done");
    const pending = dayTasks.filter((t) => t.status === "pending");
    const carriedOver = dayTasks.filter((t) => t.status === "carried_over");
    const discarded = dayTasks.filter((t) => t.status === "discarded");

    return {
      date: reviewDate,
      total: dayTasks.length,
      completed: completed.length,
      pending: pending.length,
      carriedOver: carriedOver.length,
      discarded: discarded.length,
      completionRate: dayTasks.length > 0
        ? Math.round((completed.length / dayTasks.length) * 100)
        : 0,
      pendingTasks: pending,
      allTasks: dayTasks,
    };
  }

  // ─── Task Notes ──────────────────────────────────────────

  async addNote(taskId: string, content: string) {
    const [note] = await db
      .insert(taskNotes)
      .values({ taskId, content })
      .returning();
    return note;
  }

  async listNotes(taskId: string) {
    return db
      .select()
      .from(taskNotes)
      .where(eq(taskNotes.taskId, taskId))
      .orderBy(asc(taskNotes.createdAt));
  }

  // ─── Stats & Analytics ──────────────────────────────────

  async getTodayStats() {
    const today = new Date().toISOString().slice(0, 10);
    return this.getDayStats(today);
  }

  async getDayStats(date: string) {
    const dayTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.scheduledDate, date));

    const completed = dayTasks.filter((t) => t.status === "done").length;
    const total = dayTasks.length;

    return {
      date,
      total,
      completed,
      pending: dayTasks.filter((t) => t.status === "pending").length,
      carriedOver: dayTasks.filter((t) => t.status === "carried_over").length,
      discarded: dayTasks.filter((t) => t.status === "discarded").length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  async getCompletionTrend(days: number = 7) {
    const results = [];
    const date = new Date();

    for (let i = 0; i < days; i++) {
      const dateStr = date.toISOString().slice(0, 10);
      results.push(await this.getDayStats(dateStr));
      date.setDate(date.getDate() - 1);
    }

    return results;
  }

  async getCompletionByDomain(from?: string, to?: string) {
    const conditions: SQL[] = [eq(tasks.status, "done")];
    if (from) conditions.push(gte(tasks.scheduledDate, from));
    if (to) conditions.push(lte(tasks.scheduledDate, to));

    return db
      .select({
        domain: tasks.domain,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(tasks)
      .where(and(...conditions))
      .groupBy(tasks.domain);
  }

  async getCarryOverRate(days: number = 7) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = new Date().toISOString().slice(0, 10);

    const result = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        carriedOver: sql<number>`COUNT(*) FILTER (WHERE ${tasks.carryOverCount} > 0)::int`,
      })
      .from(tasks)
      .where(
        and(
          gte(tasks.scheduledDate, fromStr),
          lte(tasks.scheduledDate, toStr)
        )
      );

    const { total, carriedOver } = result[0];
    const rate = total > 0 ? Math.round((carriedOver / total) * 100) : 0;

    // Emit overloaded event if carry-over rate > 50%
    if (rate > 50 && total >= 5) {
      await tasksEvents.overloaded({
        carryOverRate: rate,
        period: `last_${days}_days`,
      });
    }

    return { total, carriedOver, rate, days };
  }

  // ─── Private helpers ─────────────────────────────────────

  private async checkDailyCompletion(date: string) {
    const remaining = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(tasks)
      .where(
        and(
          eq(tasks.scheduledDate, date),
          eq(tasks.status, "pending")
        )
      );

    if (remaining[0].count === 0) {
      const completed = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(tasks)
        .where(
          and(
            eq(tasks.scheduledDate, date),
            eq(tasks.status, "done")
          )
        );

      if (completed[0].count > 0) {
        await tasksEvents.dailyAllCompleted({
          date,
          count: completed[0].count,
        });
      }
    }
  }

  private tomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
}

export const tasksService = new TasksService();
