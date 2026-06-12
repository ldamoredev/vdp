import { randomUUID } from 'crypto';
import { Counter } from '../../domain/Counter';
import { CounterAttempt, CounterRepository, CreateCounterData } from '../../domain/CounterRepository';

type StoredCounter = {
    counter: Counter;
    userId: string;
};

export class FakeCounterRepository extends CounterRepository {
    private counters = new Map<string, StoredCounter>();
    private attempts = new Map<string, CounterAttempt[]>();

    // ─── Test helpers ──────────────────────────────────

    seedCounter(userId: string, counter: Counter): void {
        this.counters.set(counter.id, { counter, userId });
    }

    attemptsFor(counterId: string): CounterAttempt[] {
        return this.attempts.get(counterId) ?? [];
    }

    // ─── Repository ────────────────────────────────────

    async createCounter(userId: string, data: CreateCounterData): Promise<Counter> {
        const counter = new Counter(
            randomUUID(),
            data.name,
            data.emoji ?? null,
            data.dailyCost ?? null,
            data.startedAt,
            data.lastMilestoneNotified,
            null,
            new Date(),
            new Date(),
        );
        this.counters.set(counter.id, { counter, userId });
        return counter;
    }

    async getCounter(userId: string, id: string): Promise<Counter | null> {
        const stored = this.counters.get(id);
        return stored && stored.userId === userId ? stored.counter : null;
    }

    async listCounters(userId: string, includeArchived = false): Promise<Counter[]> {
        return Array.from(this.counters.values())
            .filter((stored) => stored.userId === userId)
            .filter((stored) => includeArchived || !stored.counter.isArchived())
            .map((stored) => stored.counter);
    }

    async save(userId: string, counter: Counter): Promise<Counter> {
        this.counters.set(counter.id, { counter, userId });
        return counter;
    }

    async addAttempt(userId: string, counterId: string, attempt: {
        startedAt: string;
        endedAt: string;
        days: number;
    }): Promise<void> {
        const list = this.attempts.get(counterId) ?? [];
        list.unshift({ id: randomUUID(), counterId, ...attempt });
        this.attempts.set(counterId, list);
    }

    async getAttempts(userId: string, counterId: string): Promise<CounterAttempt[]> {
        const stored = this.counters.get(counterId);
        if (!stored || stored.userId !== userId) return [];
        return this.attempts.get(counterId) ?? [];
    }
}
