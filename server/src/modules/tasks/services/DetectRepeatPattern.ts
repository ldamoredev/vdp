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

    async execute(task: Task): Promise<void> {
        // Find similar tasks from history, with a high threshold to find near-identical ones
        const similar = await this.findSimilarTasks.execute(task.title, 10, 0.8);
        
        // Filter out the current task itself and fetch their full records
        const historicalIds = similar
            .map(s => s.taskId)
            .filter(taskId => taskId !== task.id);
            
        if (historicalIds.length === 0) return;

        const historyPromises = historicalIds.map(id => this.repository.getTask(id));
        const history = (await Promise.all(historyPromises)).filter((t): t is Task => t !== null);

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
                taskId: task.id,
                title: task.title,
                pattern,
                previousInstances: history.length
            }));
        }
    }
}
