import { Counter } from './Counter';

export type CreateCounterData = {
    readonly name: string;
    readonly emoji?: string | null;
    readonly dailyCost?: string | null;
    readonly startedAt: string;
    readonly lastMilestoneNotified: number;
};

export type CounterAttempt = {
    readonly id: string;
    readonly counterId: string;
    readonly startedAt: string;
    readonly endedAt: string;
    readonly days: number;
};

export abstract class CounterRepository {
    abstract createCounter(userId: string, data: CreateCounterData): Promise<Counter>;
    abstract getCounter(userId: string, id: string): Promise<Counter | null>;
    abstract listCounters(userId: string, includeArchived?: boolean): Promise<Counter[]>;
    abstract save(userId: string, counter: Counter): Promise<Counter>;
    /** Records a finished attempt (relapse history). */
    abstract addAttempt(userId: string, counterId: string, attempt: {
        startedAt: string;
        endedAt: string;
        days: number;
    }): Promise<void>;
    /** Past attempts for one counter, most recent first. */
    abstract getAttempts(userId: string, counterId: string): Promise<CounterAttempt[]>;
}
