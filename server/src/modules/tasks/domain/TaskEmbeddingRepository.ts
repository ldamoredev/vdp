export type SimilarTask = {
    taskId: string;
    content: string;
    similarity: number;
};

export abstract class TaskEmbeddingRepository {
    abstract upsert(userId: string, taskId: string, content: string, embedding: number[]): Promise<void>;
    abstract findSimilar(userId: string, embedding: number[], limit: number, threshold?: number): Promise<SimilarTask[]>;
    abstract deleteByTaskId(userId: string, taskId: string): Promise<void>;
}
