import { Task } from '../domain/Task';
import { TaskRepository, CreateTaskData } from '../domain/TaskRepository';
import { EmbedTask } from './EmbedTask';
import { FindSimilarTasks, SimilarTaskResult } from './FindSimilarTasks';

export type CreateTaskResult = {
    task: Task;
    similarTasks?: SimilarTaskResult[];
};

export class CreateTask {
    constructor(
        private repository: TaskRepository,
        private embedTask: EmbedTask,
        private findSimilarTasks: FindSimilarTasks,
    ) {}

    async execute(data: CreateTaskData, checkDuplicates = false): Promise<CreateTaskResult> {
        let similarTasks: SimilarTaskResult[] | undefined;

        if (checkDuplicates) {
            similarTasks = await this.findSimilarTasks.execute(data.title, 3, 0.6);
        }

        const task = await this.repository.createTask(data);
        this.embedTask.execute(task.id).catch(() => {});

        return { task, similarTasks };
    }
}
