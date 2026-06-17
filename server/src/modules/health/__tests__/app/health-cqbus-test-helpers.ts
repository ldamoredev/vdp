import { Identity } from '@nbottarini/cqbus';
import { randomUUID } from 'crypto';
import { vi } from 'vitest';

import { EventBus } from '../../../common/base/event-bus/EventBus';
import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { Counter } from '../../domain/Counter';
import { Goal } from '../../domain/Goal';
import { Habit } from '../../domain/Habit';
import { FakeCounterRepository } from '../fakes/FakeCounterRepository';
import { FakeGoalRepository } from '../fakes/FakeGoalRepository';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';

export const userId = 'user-1';
export const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
export const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

export type HealthCQBusTestContext = {
    readonly habits: FakeHabitRepository;
    readonly counters: FakeCounterRepository;
    readonly goals: FakeGoalRepository;
    readonly eventBus: EventBus;
    readonly emitted: DomainEvent[];
};

export function setupHealthCQBusTest(): HealthCQBusTestContext {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 12, 12, 0, 0));

    const eventBus = new EventBus();
    const emitted: DomainEvent[] = [];
    eventBus.on('health.counter.milestone', (event) => {
        emitted.push(event);
    });
    eventBus.on('health.goal.deadline_approaching', (event) => {
        emitted.push(event);
    });

    return {
        habits: new FakeHabitRepository(),
        counters: new FakeCounterRepository(),
        goals: new FakeGoalRepository(),
        eventBus,
        emitted,
    };
}

export function makeHabit(name = 'Leer'): Habit {
    return new Habit(randomUUID(), name, null, null, new Date(), new Date());
}

export function makeCounter(startedAt = '2026-06-02'): Counter {
    return new Counter(randomUUID(), 'Sin fumar', null, '1000.00', startedAt, 0, null, new Date(), new Date());
}

export function makeGoal(targetDate = '2026-06-17'): Goal {
    return new Goal(randomUUID(), 'Empezar el gym', null, targetDate, null, 'active', 'none', null, new Date(), new Date());
}
