import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { TaskRepository } from '../../domain/TaskRepository';
import { TaskNoteRepository } from '../../domain/TaskNoteRepository';
import { TaskEmbeddingRepository } from '../../domain/TaskEmbeddingRepository';
import { DrizzleTaskRepository } from './DrizzleTaskRepository';
import { DrizzleTaskNoteRepository } from './DrizzleTaskNoteRepository';
import { DrizzleTaskEmbeddingRepository } from './DrizzleTaskEmbeddingRepository';

export function registerTasksRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(TaskRepository, () => new DrizzleTaskRepository(db));
    registry.register(TaskNoteRepository, () => new DrizzleTaskNoteRepository(db));
    registry.register(TaskEmbeddingRepository, () => new DrizzleTaskEmbeddingRepository(db));
}
