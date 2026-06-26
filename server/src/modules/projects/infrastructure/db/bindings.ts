import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { ClientRepository } from '../../domain/ClientRepository';
import { ProjectRepository } from '../../domain/ProjectRepository';
import { TimeEntryRepository } from '../../domain/TimeEntryRepository';
import { DrizzleClientRepository } from './DrizzleClientRepository';
import { DrizzleProjectRepository } from './DrizzleProjectRepository';
import { DrizzleTimeEntryRepository } from './DrizzleTimeEntryRepository';

export function registerProjectsRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(ClientRepository, () => new DrizzleClientRepository(db));
    registry.register(ProjectRepository, () => new DrizzleProjectRepository(db));
    registry.register(TimeEntryRepository, () => new DrizzleTimeEntryRepository(db));
}
