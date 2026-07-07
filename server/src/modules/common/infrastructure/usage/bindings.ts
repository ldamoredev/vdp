import { Database } from '../../base/db/Database';
import { RepositoryRegistry } from '../../base/db/RepositoryRegistry';
import { UsageEventRepository } from '../../base/usage/UsageEventRepository';
import { DrizzleUsageEventRepository } from './DrizzleUsageEventRepository';

export function registerUsageRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(UsageEventRepository, () => new DrizzleUsageEventRepository(db));
}
