import { Task } from '../domain/Task';
import { TaskRepository, UpdateTaskData } from '../domain/TaskRepository';

export class UpdateTask {
    constructor(private repository: TaskRepository) {}

    async execute(id: string, data: UpdateTaskData): Promise<Task | null> {
        return this.repository.updateTask(id, data);
    }
}
