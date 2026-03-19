import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';

export class DiscardTask {
    constructor(private repository: TaskRepository) {}

    async execute(id: string): Promise<Task | null> {
        const task = await this.repository.getTask(id);
        if (!task) return null;

        task.discard();
        return this.repository.save(task);
    }
}
