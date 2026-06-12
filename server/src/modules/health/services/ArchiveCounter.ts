import { NotFoundHttpError } from '../../common/http/errors';
import { Counter } from '../domain/Counter';
import { CounterRepository } from '../domain/CounterRepository';

export class ArchiveCounter {
    constructor(private readonly counters: CounterRepository) {}

    async execute(userId: string, counterId: string): Promise<Counter> {
        const counter = await this.counters.getCounter(userId, counterId);
        if (!counter) throw new NotFoundHttpError('Counter not found');
        if (counter.isArchived()) return counter;

        counter.archive();
        return this.counters.save(userId, counter);
    }
}
