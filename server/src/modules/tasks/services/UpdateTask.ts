import { Task } from '../domain/Task';
import { TaskRepository, UpdateTaskData } from '../domain/TaskRepository';
import { DomainHttpError } from '../../common/http/errors';

export class UpdateTask {
    constructor(private repository: TaskRepository) {}

    async execute(id: string, data: UpdateTaskData): Promise<Task | null> {
        const task = await this.repository.getTask(id);
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

        return this.repository.save(task);
    }
}
