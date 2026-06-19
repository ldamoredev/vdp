import { localDateISO, todayISO } from '../../common/base/time/dates';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';

export type DayStats = {
    date: string;
    total: number;
    completed: number;
    pending: number;
    carriedOver: number;
    discarded: number;
    completionRate: number;
};

export type CarryOverRate = {
    total: number;
    carriedOver: number;
    rate: number;
    days: number;
};

export async function getDayStats(tasks: TaskRepository, userId: string, date: string): Promise<DayStats> {
    const scheduledTasks = await tasks.getTasksByDate(userId, date);
    const completedToday = await tasks.getTasksCompletedOnDate(userId, date);
    const completedTasks = mergeUniqueTasks(
        scheduledTasks.filter((task) => task.status === 'done'),
        completedToday,
    );
    const dayTasks = mergeUniqueTasks(scheduledTasks, completedToday);

    const completed = completedTasks.length;
    const carriedOver = dayTasks.filter((task) => task.carryOverCount > 0).length;
    const total = dayTasks.length;

    return {
        date,
        total,
        completed,
        pending: dayTasks.filter((task) => task.status === 'pending').length,
        carriedOver,
        discarded: dayTasks.filter((task) => task.status === 'discarded').length,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
}

export function getTodayStats(tasks: TaskRepository, userId: string): Promise<DayStats> {
    return getDayStats(tasks, userId, todayISO());
}

export async function getTrendStats(tasks: TaskRepository, userId: string, days = 7): Promise<DayStats[]> {
    const date = new Date();
    const toDate = localDateISO(date);
    date.setDate(date.getDate() - (days - 1));
    const fromDate = localDateISO(date);

    const rows = await tasks.getTrendByDateRange(userId, fromDate, toDate);
    const rowMap = new Map(rows.map((row) => [row.date, row]));

    const results: DayStats[] = [];
    const cursor = new Date(toDate + 'T12:00:00');
    for (let i = 0; i < days; i++) {
        const day = localDateISO(cursor);
        const row = rowMap.get(day);

        if (row) {
            results.push({
                date: day,
                total: row.total,
                completed: row.completed,
                pending: row.pending,
                carriedOver: row.carriedOver,
                discarded: row.discarded,
                completionRate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
            });
        } else {
            results.push({
                date: day,
                total: 0,
                completed: 0,
                pending: 0,
                carriedOver: 0,
                discarded: 0,
                completionRate: 0,
            });
        }

        cursor.setDate(cursor.getDate() - 1);
    }

    return results;
}

export async function getCarryOverRate(tasks: TaskRepository, userId: string, days = 7): Promise<CarryOverRate> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = localDateISO(fromDate);
    const toStr = todayISO();

    const { total, carriedOver } = await tasks.getCarryOverStats(userId, fromStr, toStr);
    const rate = total > 0 ? Math.round((carriedOver / total) * 100) : 0;

    return { total, carriedOver, rate, days };
}

export function mergeUniqueTasks(...collections: Task[][]): Task[] {
    const merged = new Map<string, Task>();

    for (const tasks of collections) {
        for (const task of tasks) {
            merged.set(task.id, task);
        }
    }

    return Array.from(merged.values());
}
