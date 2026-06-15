import { Database } from './common/base/db/Database';
import { RepositoryRegistry } from './common/base/db/RepositoryRegistry';
import { registerAgentRepositories } from './common/infrastructure/agents/bindings';
import { registerAuthRepositories } from './auth/infrastructure/db/bindings';
import { registerTasksRepositories } from './tasks/infrastructure/db/bindings';
import { registerWalletRepositories } from './wallet/infrastructure/db/bindings';
import { registerHealthRepositories } from './health/infrastructure/db/bindings';
import { registerMedicalRepositories } from './medical/infrastructure/db/bindings';

/**
 * Composes the repository bindings of every active module. Like
 * DefaultCoreConfiguration.moduleFactories, this is the only place that
 * enumerates domains: each module owns its own bindings file.
 *
 * Factories are lazy, so registering every module is safe even for test
 * configurations that bootstrap a single module.
 */
export function createDefaultRepositoryRegistry(db: Database): RepositoryRegistry {
    const registry = new RepositoryRegistry();
    registerAgentRepositories(registry, db);
    registerAuthRepositories(registry, db);
    registerTasksRepositories(registry, db);
    registerWalletRepositories(registry, db);
    registerHealthRepositories(registry, db);
    registerMedicalRepositories(registry, db);
    return registry;
}
