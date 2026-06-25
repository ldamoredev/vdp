import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { ProjectRepository } from '../../domain/ProjectRepository';
import { DrizzleProjectRepository } from './DrizzleProjectRepository';

export function registerProjectsRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(ProjectRepository, () => new DrizzleProjectRepository(db));
}
