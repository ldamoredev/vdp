import { TaskRepository } from '../domain/TaskRepository';

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
        const fromStr = fromDate.toISOString().slice(0, 10);
        const toStr = new Date().toISOString().slice(0, 10);

        const { total, carriedOver } = await this.repository.getCarryOverStats(fromStr, toStr);
        const rate = total > 0 ? Math.round((carriedOver / total) * 100) : 0;

        return { total, carriedOver, rate, days };
    }
}
