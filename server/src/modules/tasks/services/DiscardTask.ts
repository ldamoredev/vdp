import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { DomainHttpError } from '../../common/http/errors';

export class DiscardTask {
    constructor(private repository: TaskRepository) {}

    async execute(id: string): Promise<Task | null> {
        const task = await this.repository.getTask(id);
        if (!task) return null;

        if (task.status !== 'pending') {
            throw new DomainHttpError(`Cannot discard a ${task.status} task`);
        }

        task.discard();
        return this.repository.save(task);
    }
}
