import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { ObjectiveRepository } from '../../domain/ObjectiveRepository';
import { DrizzleObjectiveRepository } from './DrizzleObjectiveRepository';

export function registerObjectivesRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(ObjectiveRepository, () => new DrizzleObjectiveRepository(db));
}
