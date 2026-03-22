import { TaskEmbeddingRepository, SimilarTask } from '../domain/TaskEmbeddingRepository';
import { EmbeddingProvider } from '../../common/base/embeddings/EmbeddingProvider';

export type SimilarTaskResult = SimilarTask & {
    matchPercent: number;
};

export class FindSimilarTasks {
    constructor(
        private embeddingRepository: TaskEmbeddingRepository,
        private embeddingProvider: EmbeddingProvider,
    ) {}

    async execute(query: string, limit = 5, threshold = 0.7): Promise<SimilarTaskResult[]> {
        const embedding = await this.embeddingProvider.embed(query);
        const similar = await this.embeddingRepository.findSimilar(embedding, limit, threshold);

        return similar.map((s) => ({
            ...s,
            matchPercent: Math.round(s.similarity * 100),
        }));
    }
}
