import { TaskEmbeddingRepository, SimilarTask } from '../../domain/TaskEmbeddingRepository';

type StoredEmbedding = {
    content: string;
    embedding: number[];
};

export class FakeTaskEmbeddingRepository extends TaskEmbeddingRepository {
    private store = new Map<string, StoredEmbedding>();

    async upsert(taskId: string, content: string, embedding: number[]): Promise<void> {
        this.store.set(taskId, { content, embedding });
    }

    async findSimilar(embedding: number[], limit: number, threshold = 0.7): Promise<SimilarTask[]> {
        const results: SimilarTask[] = [];

        for (const [taskId, stored] of this.store) {
            const similarity = cosineSimilarity(embedding, stored.embedding);
            if (similarity > threshold) {
                results.push({ taskId, content: stored.content, similarity });
            }
        }

        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    async deleteByTaskId(taskId: string): Promise<void> {
        this.store.delete(taskId);
    }

    get size(): number {
        return this.store.size;
    }

    getByTaskId(taskId: string): StoredEmbedding | undefined {
        return this.store.get(taskId);
    }

    seed(taskId: string, content: string, embedding: number[]): void {
        this.store.set(taskId, { content, embedding });
    }

    clear(): void {
        this.store.clear();
    }
}

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dot / magnitude;
}
