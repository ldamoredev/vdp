import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { HabitRepository } from '../../domain/HabitRepository';
import { DrizzleHabitRepository } from './DrizzleHabitRepository';

export function registerHealthRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(HabitRepository, () => new DrizzleHabitRepository(db));
}
