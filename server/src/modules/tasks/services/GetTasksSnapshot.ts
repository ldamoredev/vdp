import { todayISO } from '../../common/base/time/dates';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';

export type StuckTaskInfo = {
    readonly title: string;
    readonly carryOverCount: number;
};

export type TasksSnapshot = {
    readonly pendingCount: number;
    readonly completedCount: number;
    readonly totalCount: number;
    readonly completionRate: number;
    readonly stuckTasks: readonly StuckTaskInfo[];
};

export class GetTasksSnapshot {
    constructor(private readonly tasks: TaskRepository) {}

    async execute(userId: string): Promise<TasksSnapshot> {
        const today = todayISO();
        const scheduledTasks = await this.tasks.getTasksByDate(userId, today);
        const completedToday = await this.tasks.getTasksCompletedOnDate(userId, today);
        const todayTasks = mergeUniqueTasks(scheduledTasks, completedToday);
        const pendingTasks = todayTasks.filter((task) => task.status === 'pending');
        const completedTasks = mergeUniqueTasks(
            scheduledTasks.filter((task) => task.status === 'done'),
            completedToday,
        );
        const totalCount = todayTasks.length;

        return {
            pendingCount: pendingTasks.length,
            completedCount: completedTasks.length,
            totalCount,
            completionRate: totalCount === 0 ? 0 : Math.round((completedTasks.length / totalCount) * 100),
            stuckTasks: pendingTasks
                .filter((task) => task.carryOverCount >= 3)
                .map((task) => ({
                    title: task.title,
                    carryOverCount: task.carryOverCount,
            })),
        };
    }
}

function mergeUniqueTasks(...collections: Task[][]): Task[] {
    const merged = new Map<string, Task>();

    for (const tasks of collections) {
        for (const task of tasks) {
            merged.set(task.id, task);
        }
    }

    return Array.from(merged.values());
}
