import { todayISO } from '../../common/base/time/dates';
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
        const todayTasks = await this.tasks.getTasksByDate(userId, todayISO());
        const pendingTasks = todayTasks.filter((task) => task.status === 'pending');
        const completedTasks = todayTasks.filter((task) => task.status === 'done');
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
