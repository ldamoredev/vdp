import { Database } from '../../base/db/Database';
import { TaskRepository } from '../../../tasks/domain/TaskRepository';
import { DrizzleTaskRepository } from '../../../tasks/infrastructure/db/DrizzleTaskRepository';
import { TaskNoteRepository } from '../../../tasks/domain/TaskNoteRepository';
import { DrizzleTaskNoteRepository } from '../../../tasks/infrastructure/db/DrizzleTaskNoteRepository';
import { RepositoryProvider } from '../../base/db/RepositoryProvider';
import { AgentRepository } from '../../base/agents/AgentRepository';
import { DrizzleAgentRepository } from '../agents/DrizzleAgentRepository';
import { TaskEmbeddingRepository } from '../../../tasks/domain/TaskEmbeddingRepository';
import { DrizzleTaskEmbeddingRepository } from '../../../tasks/infrastructure/db/DrizzleTaskEmbeddingRepository';

export class DrizzleRepositoryProvider extends RepositoryProvider {
    constructor(private db: Database) {
        super();
    }

    protected create<T>(token: abstract new (...args: any[]) => T): T {
        switch (token) {
            case TaskRepository:
                return new DrizzleTaskRepository(this.db) as T;
            case TaskNoteRepository:
                return new DrizzleTaskNoteRepository(this.db) as T;
            case TaskEmbeddingRepository:
                return new DrizzleTaskEmbeddingRepository(this.db) as T;
            case AgentRepository:
                return new DrizzleAgentRepository(this.db) as T;
            default:
                throw new Error(`${token.name} not implemented`);
        }
    }
}
