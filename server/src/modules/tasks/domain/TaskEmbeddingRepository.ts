export type SimilarTask = {
    taskId: string;
    content: string;
    similarity: number;
};

export abstract class TaskEmbeddingRepository {
    abstract upsert(taskId: string, content: string, embedding: number[]): Promise<void>;
    abstract findSimilar(embedding: number[], limit: number, threshold?: number): Promise<SimilarTask[]>;
    abstract deleteByTaskId(taskId: string): Promise<void>;
}
