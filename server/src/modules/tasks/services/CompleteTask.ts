import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TaskCompleted } from '../domain/events/TaskCompleted';
import { DomainHttpError } from '../../common/http/errors';

export class CompleteTask {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    async execute(userId: string, id: string): Promise<Task | null> {
        const task = await this.repository.getTask(userId, id);
        if (!task) return null;

        if (task.status !== 'pending') {
            throw new DomainHttpError(`Cannot complete a ${task.status} task`);
        }

        task.complete();
        const saved = await this.repository.save(userId, task);

        await this.eventBus.emit(new TaskCompleted({
            userId,
            taskId: saved.id,
            scheduledDate: saved.scheduledDate,
        }));

        return saved;
    }
}
