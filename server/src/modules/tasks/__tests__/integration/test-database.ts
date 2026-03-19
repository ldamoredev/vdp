import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as tasksSchema from '../../infrastructure/db/schema';

const SETUP_SQL = `
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS tasks;

CREATE TABLE IF NOT EXISTS core.agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES core.agent_conversations(id),
    role VARCHAR(10) NOT NULL,
    content TEXT,
    tool_calls JSONB,
    tool_result JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 2,
    scheduled_date DATE NOT NULL,
    domain VARCHAR(20),
    completed_at TIMESTAMP,
    carry_over_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks.task_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks.tasks(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_scheduled_date_idx ON tasks.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_domain_idx ON tasks.tasks(domain);
CREATE INDEX IF NOT EXISTS task_notes_task_idx ON tasks.task_notes(task_id);
CREATE INDEX IF NOT EXISTS core_msg_conversation_idx ON core.agent_messages(conversation_id);
`;

const CONNECTION_STRING = 'postgresql://test:test@localhost:5433/vdp_test';

export class TestDatabase {
    public query;
    private pool: pg.Pool;

    constructor() {
        this.pool = new pg.Pool({ connectionString: CONNECTION_STRING });
        this.query = drizzle(this.pool, { schema: tasksSchema });
    }

    async setup(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(SETUP_SQL);
        } finally {
            client.release();
        }
    }

    async truncate(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(
                'TRUNCATE core.agent_messages, core.agent_conversations, tasks.task_notes, tasks.tasks CASCADE',
            );
        } finally {
            client.release();
        }
    }

    async teardown(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('DROP SCHEMA IF EXISTS core CASCADE');
            await client.query('DROP SCHEMA IF EXISTS tasks CASCADE');
        } finally {
            client.release();
        }
    }

    async destroy(): Promise<void> {
        await this.pool.end();
    }
}

// Singleton — shared across all integration test files
export const testDb = new TestDatabase();
