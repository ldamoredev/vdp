import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { TaskRepository } from '../../domain/TaskRepository';
import { TaskNoteRepository } from '../../domain/TaskNoteRepository';
import { TaskEmbeddingRepository } from '../../domain/TaskEmbeddingRepository';
import { TaskInsightRepository } from '../../domain/TaskInsightRepository';
import { DrizzleTaskRepository } from './DrizzleTaskRepository';
import { DrizzleTaskNoteRepository } from './DrizzleTaskNoteRepository';
import { DrizzleTaskEmbeddingRepository } from './DrizzleTaskEmbeddingRepository';
import { DrizzleTaskInsightRepository } from './DrizzleTaskInsightRepository';
import { DailyReviewStateRepository } from '../../domain/DailyReviewStateRepository';
import { DrizzleDailyReviewStateRepository } from './DrizzleDailyReviewStateRepository';

export function registerTasksRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(TaskRepository, () => new DrizzleTaskRepository(db));
    registry.register(TaskNoteRepository, () => new DrizzleTaskNoteRepository(db));
    registry.register(TaskEmbeddingRepository, () => new DrizzleTaskEmbeddingRepository(db));
    registry.register(TaskInsightRepository, () => new DrizzleTaskInsightRepository(db));
    registry.register(DailyReviewStateRepository, () => new DrizzleDailyReviewStateRepository(db));
}
