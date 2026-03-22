import { customType } from 'drizzle-orm/pg-core';
import { uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { tasksSchema, tasks } from './schema';

// ─── Custom pgvector type ───────────────────────────────
const vector = (name: string, dimensions: number) =>
    customType<{ data: number[]; driverData: string }>({
        dataType() {
            return `vector(${dimensions})`;
        },
        toDriver(value: number[]): string {
            return `[${value.join(',')}]`;
        },
        fromDriver(value: string): number[] {
            return value
                .slice(1, -1)
                .split(',')
                .map(Number);
        },
    })(name);

// ─── Task Embeddings ────────────────────────────────────
// Stores vector embeddings for semantic similarity search
export const EMBEDDING_DIMENSIONS = 768;

export const taskEmbeddings = tasksSchema.table(
    'task_embeddings',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        taskId: uuid('task_id')
            .notNull()
            .references(() => tasks.id, { onDelete: 'cascade' })
            .unique(),
        content: text('content').notNull(),
        embedding: vector('embedding', EMBEDDING_DIMENSIONS).notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => [
        index('task_embeddings_task_id_idx').on(table.taskId),
    ],
);
