import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { HabitRepository } from '../../domain/HabitRepository';
import { CounterRepository } from '../../domain/CounterRepository';
import { GoalRepository } from '../../domain/GoalRepository';
import { DrizzleHabitRepository } from './DrizzleHabitRepository';
import { DrizzleCounterRepository } from './DrizzleCounterRepository';
import { DrizzleGoalRepository } from './DrizzleGoalRepository';

export function registerHealthRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(HabitRepository, () => new DrizzleHabitRepository(db));
    registry.register(CounterRepository, () => new DrizzleCounterRepository(db));
    registry.register(GoalRepository, () => new DrizzleGoalRepository(db));
}
