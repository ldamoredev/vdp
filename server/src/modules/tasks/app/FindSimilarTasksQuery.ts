import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EmbeddingProvider } from '../../common/base/embeddings/EmbeddingProvider';
import { TaskEmbeddingRepository } from '../domain/TaskEmbeddingRepository';
import { FindSimilarTasks, SimilarTaskResult } from '../services/FindSimilarTasks';

export class FindSimilarTasksQuery extends Query<SimilarTaskResult[]> {
    constructor(
        readonly query: string,
        readonly limit?: number,
        readonly threshold?: number,
    ) {
        super();
    }
}

export class FindSimilarTasksQueryHandler implements RequestHandler<FindSimilarTasksQuery, SimilarTaskResult[]> {
    constructor(
        private readonly embeddings: TaskEmbeddingRepository,
        private readonly embeddingProvider: EmbeddingProvider,
    ) {}

    async handle(query: FindSimilarTasksQuery, identity: Identity): Promise<SimilarTaskResult[]> {
        const { userId } = requireUserIdentity(identity);
        return new FindSimilarTasks(this.embeddings, this.embeddingProvider)
            .execute(userId, query.query, query.limit, query.threshold);
    }
}
