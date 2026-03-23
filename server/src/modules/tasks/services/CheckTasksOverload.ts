import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TasksOverloaded } from '../domain/events/TasksOverloaded';
import { todayISO, localDateISO } from '../../common/base/time/dates';

export type OverloadCheckResult = {
    total: number;
    carriedOver: number;
    rate: number;
    days: number;
    overloaded: boolean;
    averageCompletion: number;
    threshold: number;
};

export class CheckTasksOverload {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    async execute(days: number = 7): Promise<OverloadCheckResult> {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - (days + 1)); // Exclude today for the baseline
        const fromStr = localDateISO(fromDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const toStr = localDateISO(yesterday);

        const { total, carriedOver } = await this.repository.getCarryOverStats(fromStr, toStr);
        const rate = total > 0 ? Math.round((carriedOver / total) * 100) : 0;
        
        // Calculate 7-day average completion (done tasks)
        const completedCount = total - carriedOver;
        const averageCompletion = completedCount / days;
        
        // Heuristic: threshold = 1.5 * average completion, but at least 3 tasks
        let threshold = Math.max(3, Math.ceil(averageCompletion * 1.5));
        
        // Reduce threshold if carry-over rate is high (>40%)
        if (rate > 40) {
            threshold = Math.max(2, Math.ceil(threshold * 0.8));
        }

        // Check current load for today
        const todayStr = todayISO();
        const todayTasks = await this.repository.getTasksByDateAndStatus(todayStr, 'pending');
        const currentLoad = todayTasks.length;

        const overloaded = currentLoad > threshold;

        if (overloaded) {
            await this.eventBus.emit(new TasksOverloaded({
                carryOverRate: rate,
                period: `last_${days}_days`,
                currentLoad,
                threshold
            }));
        }

        return { 
            total, 
            carriedOver, 
            rate, 
            days, 
            overloaded, 
            averageCompletion: Math.round(averageCompletion * 10) / 10, 
            threshold 
        };
    }
}
