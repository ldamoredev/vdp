import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { HabitRepository } from '../../domain/HabitRepository';
import { CounterRepository } from '../../domain/CounterRepository';
import { DrizzleHabitRepository } from './DrizzleHabitRepository';
import { DrizzleCounterRepository } from './DrizzleCounterRepository';

export function registerHealthRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(HabitRepository, () => new DrizzleHabitRepository(db));
    registry.register(CounterRepository, () => new DrizzleCounterRepository(db));
}
