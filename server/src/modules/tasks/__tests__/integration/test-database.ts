import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as agentSchema from '../../../common/infrastructure/agents/schema';
import * as walletSchema from '../../../wallet/schema';
import * as tasksSchema from '../../infrastructure/db/schema';
import * as embeddingsSchema from '../../infrastructure/db/embeddings-schema';

const SETUP_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS tasks;
CREATE SCHEMA IF NOT EXISTS wallet;

CREATE TABLE IF NOT EXISTS core.agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES core.agent_conversations(id) ON DELETE CASCADE,
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
    task_id UUID NOT NULL REFERENCES tasks.tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'note',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks.task_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL UNIQUE REFERENCES tasks.tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_scheduled_date_idx ON tasks.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_domain_idx ON tasks.tasks(domain);
CREATE INDEX IF NOT EXISTS tasks_date_status_idx ON tasks.tasks(scheduled_date, status);
CREATE INDEX IF NOT EXISTS task_notes_task_idx ON tasks.task_notes(task_id);
CREATE INDEX IF NOT EXISTS core_msg_conversation_idx ON core.agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS agent_conv_domain_updated_idx ON core.agent_conversations(domain, updated_at);
CREATE INDEX IF NOT EXISTS task_embeddings_task_id_idx ON tasks.task_embeddings(task_id);

CREATE TABLE IF NOT EXISTS wallet.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    type VARCHAR(20) NOT NULL,
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(60) NOT NULL,
    type VARCHAR(10) NOT NULL,
    icon VARCHAR(30),
    parent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES wallet.accounts(id),
    category_id UUID REFERENCES wallet.categories(id),
    type VARCHAR(10) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    description VARCHAR(255),
    date DATE NOT NULL,
    transfer_to_account_id UUID REFERENCES wallet.accounts(id),
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    deadline DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet.savings_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES wallet.savings_goals(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES wallet.transactions(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    note VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS wallet.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    account_id UUID REFERENCES wallet.accounts(id),
    currency VARCHAR(3) NOT NULL,
    invested_amount NUMERIC(15, 2) NOT NULL,
    current_value NUMERIC(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    rate NUMERIC(6, 4),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(15, 4) NOT NULL,
    type VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON wallet.categories(parent_id);
CREATE INDEX IF NOT EXISTS tx_account_date_idx ON wallet.transactions(account_id, date);
CREATE INDEX IF NOT EXISTS tx_category_date_idx ON wallet.transactions(category_id, date);
CREATE INDEX IF NOT EXISTS tx_transfer_to_account_idx ON wallet.transactions(transfer_to_account_id);
CREATE INDEX IF NOT EXISTS sc_goal_id_idx ON wallet.savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS sc_transaction_id_idx ON wallet.savings_contributions(transaction_id);
CREATE INDEX IF NOT EXISTS investments_account_id_idx ON wallet.investments(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS exchange_rate_unique_idx
    ON wallet.exchange_rates(from_currency, to_currency, type, date);
`;

const CONNECTION_STRING = 'postgresql://test:test@localhost:5433/vdp_test';

export class TestDatabase {
    public query;
    private pool: pg.Pool;

    constructor() {
        this.pool = new pg.Pool({ connectionString: CONNECTION_STRING });
        this.query = drizzle(this.pool, {
            schema: { ...agentSchema, ...walletSchema, ...tasksSchema, ...embeddingsSchema },
        });
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
                `TRUNCATE
                    core.agent_messages,
                    core.agent_conversations,
                    tasks.task_embeddings,
                    tasks.task_notes,
                    tasks.tasks,
                    wallet.savings_contributions,
                    wallet.transactions,
                    wallet.investments,
                    wallet.exchange_rates,
                    wallet.savings_goals,
                    wallet.categories,
                    wallet.accounts
                 CASCADE`,
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
            await client.query('DROP SCHEMA IF EXISTS wallet CASCADE');
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
