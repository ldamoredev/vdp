import { Task } from '../domain/Task';
import { TaskRepository, CreateTaskData } from '../domain/TaskRepository';

export class CreateTask {
    constructor(private repository: TaskRepository) {}

    async execute(data: CreateTaskData): Promise<Task> {
        return this.repository.createTask(data);
    }
}
