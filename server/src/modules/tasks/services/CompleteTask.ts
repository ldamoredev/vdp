import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TaskCompleted } from '../domain/events/TaskCompleted';

export class CompleteTask {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    async execute(id: string): Promise<Task | null> {
        const task = await this.repository.getTask(id);
        if (!task) return null;

        task.complete();
        const saved = await this.repository.save(task);

        await this.eventBus.emit(new TaskCompleted({
            taskId: saved.id,
            scheduledDate: saved.scheduledDate,
        }));

        return saved;
    }
}
