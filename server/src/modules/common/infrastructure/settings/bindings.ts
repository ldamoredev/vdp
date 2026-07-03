import { Database } from '../../base/db/Database';
import { RepositoryRegistry } from '../../base/db/RepositoryRegistry';
import { AppSettingsRepository } from '../../base/settings/AppSettingsRepository';
import { DrizzleAppSettingsRepository } from './DrizzleAppSettingsRepository';

export function registerSettingsRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(AppSettingsRepository, () => new DrizzleAppSettingsRepository(db));
}
