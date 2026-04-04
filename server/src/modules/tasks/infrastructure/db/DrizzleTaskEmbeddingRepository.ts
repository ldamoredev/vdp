import { Database } from '../../../common/base/db/Database';
import { TaskEmbeddingRepository, SimilarTask } from '../../domain/TaskEmbeddingRepository';
import { taskEmbeddings } from './embeddings-schema';
import { tasks } from './schema';
import { and, eq, sql } from 'drizzle-orm';

export class DrizzleTaskEmbeddingRepository extends TaskEmbeddingRepository {
    constructor(private db: Database) {
        super();
    }

    async upsert(userId: string, taskId: string, content: string, embedding: number[]): Promise<void> {
        const vectorLiteral = `[${embedding.join(',')}]`;

        const [task] = await this.db.query
            .select({ id: tasks.id })
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.ownerUserId, userId)))
            .limit(1);

        if (!task) {
            throw new Error('Task not found');
        }

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

    async findSimilar(userId: string, embedding: number[], limit: number, threshold = 0.7): Promise<SimilarTask[]> {
        const vectorLiteral = `[${embedding.join(',')}]`;

        const result = await this.db.query.execute(sql`
            WITH ranked AS (
                SELECT
                    embeddings.task_id,
                    embeddings.content,
                    1 - (embeddings.embedding <=> ${vectorLiteral}::vector) AS similarity
                FROM tasks.task_embeddings embeddings
                INNER JOIN tasks.tasks task ON task.id = embeddings.task_id
                WHERE task.owner_user_id = ${userId}
                ORDER BY embeddings.embedding <=> ${vectorLiteral}::vector
                LIMIT ${limit * 2}
            )
            SELECT task_id, content, similarity
            FROM ranked
            WHERE similarity > ${threshold}
            ORDER BY similarity DESC
            LIMIT ${limit}
        `);

        type SimilarRow = { task_id: string; content: string; similarity: number };
        const rows: SimilarRow[] = (result as unknown as { rows?: SimilarRow[] }).rows ?? (result as unknown as SimilarRow[]);
        return rows.map((row) => ({
            taskId: row.task_id,
            content: row.content,
            similarity: Number(row.similarity),
        }));
    }

    async deleteByTaskId(userId: string, taskId: string): Promise<void> {
        await this.db.query.execute(sql`
            DELETE FROM tasks.task_embeddings embeddings
            USING tasks.tasks task
            WHERE embeddings.task_id = ${taskId}
              AND task.id = embeddings.task_id
              AND task.owner_user_id = ${userId}
        `);
    }
}
