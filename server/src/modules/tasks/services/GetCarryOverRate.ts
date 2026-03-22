import { TaskRepository } from '../domain/TaskRepository';
import { todayISO, localDateISO } from '../../common/base/time/dates';

export type CarryOverRate = {
    total: number;
    carriedOver: number;
    rate: number;
    days: number;
};

export class GetCarryOverRate {
    constructor(private repository: TaskRepository) {}

    async execute(days: number = 7): Promise<CarryOverRate> {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        const fromStr = localDateISO(fromDate);
        const toStr = todayISO();

        const { total, carriedOver } = await this.repository.getCarryOverStats(fromStr, toStr);
        const rate = total > 0 ? Math.round((carriedOver / total) * 100) : 0;

        return { total, carriedOver, rate, days };
    }
}
