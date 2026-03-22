import { Task } from '../domain/Task';
import { TaskRepository, CreateTaskData } from '../domain/TaskRepository';
import { EmbedTask } from './EmbedTask';

export class CreateTask {
    constructor(
        private repository: TaskRepository,
        private embedTask: EmbedTask,
    ) {}

    async execute(data: CreateTaskData): Promise<Task> {
        const task = await this.repository.createTask(data);
        this.embedTask.execute(task.id).catch(() => {});
        return task;
    }
}
