import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TaskStuck } from '../domain/events/TaskStuck';
import { tomorrowISO } from '../../common/base/utils/dates';

export class CarryOverTask {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    async execute(id: string, toDate?: string): Promise<Task | null> {
        const task = await this.repository.getTask(id);
        if (!task) return null;

        const targetDate = toDate || this.tomorrow();
        task.carryOver(targetDate);

        const saved = await this.repository.save(task);

        if (saved.isStuck()) {
            await this.eventBus.emit(new TaskStuck({
                taskId: saved.id,
                title: saved.title,
                carryOverCount: saved.carryOverCount,
            }));
        }

        return saved;
    }

    private tomorrow(): string {
        return tomorrowISO();
    }
}
