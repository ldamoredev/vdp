import { TaskRepository } from '../domain/TaskRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TasksOverloaded } from '../domain/events/TasksOverloaded';
import { todayISO, localDateISO } from '../../common/base/utils/dates';

export type OverloadCheckResult = {
    total: number;
    carriedOver: number;
    rate: number;
    days: number;
    overloaded: boolean;
};

export class CheckTasksOverload {
    constructor(
        private repository: TaskRepository,
        private eventBus: EventBus,
    ) {}

    async execute(days: number = 7): Promise<OverloadCheckResult> {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        const fromStr = localDateISO(fromDate);
        const toStr = todayISO();

        const { total, carriedOver } = await this.repository.getCarryOverStats(fromStr, toStr);
        const rate = total > 0 ? Math.round((carriedOver / total) * 100) : 0;
        const overloaded = rate > 50 && total >= 5;

        if (overloaded) {
            await this.eventBus.emit(new TasksOverloaded({
                carryOverRate: rate,
                period: `last_${days}_days`,
            }));
        }

        return { total, carriedOver, rate, days, overloaded };
    }
}
