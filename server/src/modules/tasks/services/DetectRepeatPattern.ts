import { Task } from '../domain/Task';
import { FindSimilarTasks } from './FindSimilarTasks';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TaskRepeatDetected, RepeatPatternType } from '../domain/events/TaskRepeatDetected';
import { TaskRepository } from '../domain/TaskRepository';

export class DetectRepeatPattern {
    constructor(
        private findSimilarTasks: FindSimilarTasks,
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    async execute(userId: string, task: Task): Promise<void> {
        // Find similar tasks from history, with a high threshold to find near-identical ones
        const similar = await this.findSimilarTasks.execute(userId, task.title, 10, 0.8);

        // Filter out the current task itself and batch-fetch their full records
        const historicalIds = similar
            .map(s => s.taskId)
            .filter(taskId => taskId !== task.id);

        if (historicalIds.length === 0) return;

        const history = await this.repository.getTasksByIds(userId, historicalIds);

        const discardedCount = history.filter(h => h.status === 'discarded').length;
        const doneCount = history.filter(h => h.status === 'done').length;

        let pattern: RepeatPatternType | null = null;

        if (discardedCount >= 2) {
            pattern = 'habitual_discard';
        } else if (doneCount >= 3) {
            pattern = 'frequent_recreation';
        }

        if (pattern) {
            await this.eventBus.emit(new TaskRepeatDetected({
                userId,
                taskId: task.id,
                title: task.title,
                pattern,
                previousInstances: history.length,
            }));
        }
    }
}
