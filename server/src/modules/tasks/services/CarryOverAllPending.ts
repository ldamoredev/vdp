import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { CarryOverTask } from './CarryOverTask';

export class CarryOverAllPending {
    constructor(
        private repository: TaskRepository,
        private carryOverTask: CarryOverTask,
    ) {}

    async execute(userId: string, fromDate: string, toDate?: string): Promise<Task[]> {
        const pendingTasks = await this.repository.getTasksByDateAndStatus(userId, fromDate, "pending");
        const results: Task[] = [];

        for (const task of pendingTasks) {
            const carried = await this.carryOverTask.execute(userId, task.id, toDate);
            if (carried) results.push(carried);
        }

        return results;
    }
}
