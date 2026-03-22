import { Database } from '../../../common/base/db/Database';
import { TaskEmbeddingRepository, SimilarTask } from '../../domain/TaskEmbeddingRepository';
import { taskEmbeddings } from './embeddings-schema';
import { eq, sql } from 'drizzle-orm';

export class DrizzleTaskEmbeddingRepository extends TaskEmbeddingRepository {
    constructor(private db: Database) {
        super();
    }

    async upsert(taskId: string, content: string, embedding: number[]): Promise<void> {
        const vectorLiteral = `[${embedding.join(',')}]`;

        await this.db.query
            .insert(taskEmbeddings)
            .values({
                taskId,
                content,
                embedding,
            })
            .onConflictDoUpdate({
                target: taskEmbeddings.taskId,
                set: {
                    content,
                    embedding: sql`${vectorLiteral}::vector`,
                    createdAt: sql`NOW()`,
                },
            });
    }

    async findSimilar(embedding: number[], limit: number, threshold = 0.7): Promise<SimilarTask[]> {
        const vectorLiteral = `[${embedding.join(',')}]`;

        const result = await this.db.query.execute(sql`
            SELECT
                task_id,
                content,
                1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
            FROM tasks.task_embeddings
            WHERE 1 - (embedding <=> ${vectorLiteral}::vector) > ${threshold}
            ORDER BY embedding <=> ${vectorLiteral}::vector
            LIMIT ${limit}
        `);

        const rows = (result as any).rows ?? result;
        return (rows as any[]).map((row: any) => ({
            taskId: row.task_id,
            content: row.content,
            similarity: Number(row.similarity),
        }));
    }

    async deleteByTaskId(taskId: string): Promise<void> {
        await this.db.query.delete(taskEmbeddings).where(eq(taskEmbeddings.taskId, taskId));
    }
}
