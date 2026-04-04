import { Task } from '../domain/Task';
import { TaskRepository, UpdateTaskData } from '../domain/TaskRepository';
import { DomainHttpError } from '../../common/http/errors';
import { EmbedTask } from './EmbedTask';

export class UpdateTask {
    constructor(
        private repository: TaskRepository,
        private embedTask: EmbedTask,
    ) {}

    async execute(userId: string, id: string, data: UpdateTaskData): Promise<Task | null> {
        const task = await this.repository.getTask(userId, id);
        if (!task) return null;

        if (task.status !== 'pending') {
            throw new DomainHttpError(`Cannot update a ${task.status} task`);
        }

        if (data.title !== undefined) task.title = data.title;
        if (data.description !== undefined) task.description = data.description;
        if (data.priority !== undefined) task.priority = data.priority;
        if (data.scheduledDate !== undefined) task.scheduledDate = data.scheduledDate;
        if (data.domain !== undefined) task.domain = data.domain;
        task.updatedAt = new Date();

        const saved = await this.repository.save(userId, task);
        this.embedTask.execute(userId, id).catch((err: unknown) => {
            console.warn('[EmbedTask] failed for task', id, err instanceof Error ? err.message : err);
        });
        return saved;
    }
}
