import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from '../modules/auth/infrastructure/db/schema';
import * as agentSchema from '../modules/common/infrastructure/agents/schema';
import * as walletSchema from '../modules/wallet/infrastructure/db/schema';
import * as projectsSchema from '../modules/projects/infrastructure/db/schema';
import * as objectivesSchema from '../modules/objectives/infrastructure/db/schema';
import * as tasksSchema from '../modules/tasks/infrastructure/db/schema';
import * as embeddingsSchema from '../modules/tasks/infrastructure/db/embeddings-schema';
import { DEFAULT_TEST_USERS, TestUser } from './testUsers';

const SETUP_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS tasks;
CREATE SCHEMA IF NOT EXISTS wallet;
CREATE SCHEMA IF NOT EXISTS health;
CREATE SCHEMA IF NOT EXISTS medical;
CREATE SCHEMA IF NOT EXISTS projects;
CREATE SCHEMA IF NOT EXISTS objectives;

CREATE TABLE IF NOT EXISTS core.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
    actor_session_id UUID REFERENCES core.sessions(id) ON DELETE SET NULL,
    action VARCHAR(120) NOT NULL,
    resource_type VARCHAR(120) NOT NULL,
    resource_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    domain VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES core.agent_conversations(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,
    content TEXT,
    tool_calls JSONB,
    tool_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 2,
    scheduled_date DATE NOT NULL,
    domain VARCHAR(20),
    project_id UUID,
    board_status VARCHAR(20) NOT NULL DEFAULT 'backlog',
    completed_at TIMESTAMPTZ,
    carry_over_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL,
    outcome TEXT NOT NULL,
    next_action TEXT NOT NULL,
    focus VARCHAR(160) NOT NULL,
    client_id UUID REFERENCES projects.clients(id) ON DELETE SET NULL,
    client VARCHAR(160),
    hourly_rate NUMERIC(15, 2),
    rate_currency VARCHAR(3) NOT NULL DEFAULT 'ARS',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects.projects(id) ON DELETE CASCADE,
    task_id UUID,
    date DATE NOT NULL,
    minutes INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS objectives.objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metric_source VARCHAR(40) NOT NULL,
    target NUMERIC(15, 2) NOT NULL,
    unit VARCHAR(24) NOT NULL,
    manual_value NUMERIC(15, 2),
    currency VARCHAR(3),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    archived_at TIMESTAMPTZ,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_project_id_projects_id_fk'
    ) THEN
        ALTER TABLE tasks.tasks
            ADD CONSTRAINT tasks_project_id_projects_id_fk
            FOREIGN KEY (project_id) REFERENCES projects.projects(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS tasks.task_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
    task_id UUID NOT NULL REFERENCES tasks.tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'note',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks.task_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL UNIQUE REFERENCES tasks.tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks.task_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks.daily_review_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    acknowledged_signal_ids TEXT[] NOT NULL DEFAULT '{}',
    watched_category_ids TEXT[] NOT NULL DEFAULT '{}',
    note TEXT NOT NULL DEFAULT '',
    opened_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    focus_task_id UUID REFERENCES tasks.tasks(id) ON DELETE SET NULL,
    planned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS daily_review_owner_date_idx ON tasks.daily_review_state(owner_user_id, date);

CREATE INDEX IF NOT EXISTS tasks_scheduled_date_idx ON tasks.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS tasks_owner_user_idx ON tasks.tasks(owner_user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_domain_idx ON tasks.tasks(domain);
CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_project_board_idx ON tasks.tasks(project_id, board_status);
CREATE INDEX IF NOT EXISTS tasks_date_status_idx ON tasks.tasks(scheduled_date, status);
CREATE INDEX IF NOT EXISTS clients_owner_user_idx ON projects.clients(owner_user_id);
CREATE INDEX IF NOT EXISTS clients_status_idx ON projects.clients(status);
CREATE UNIQUE INDEX IF NOT EXISTS clients_owner_name_idx ON projects.clients(owner_user_id, name);
CREATE INDEX IF NOT EXISTS projects_owner_user_idx ON projects.projects(owner_user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects.projects(status);
CREATE INDEX IF NOT EXISTS projects_kind_idx ON projects.projects(kind);
CREATE INDEX IF NOT EXISTS projects_client_idx ON projects.projects(client_id);
CREATE INDEX IF NOT EXISTS time_entries_owner_date_idx ON projects.time_entries(owner_user_id, date);
CREATE INDEX IF NOT EXISTS time_entries_project_date_idx ON projects.time_entries(project_id, date);
CREATE INDEX IF NOT EXISTS time_entries_task_idx ON projects.time_entries(task_id);
CREATE INDEX IF NOT EXISTS objectives_owner_user_idx ON objectives.objectives(owner_user_id);
CREATE INDEX IF NOT EXISTS objectives_status_idx ON objectives.objectives(status);
CREATE INDEX IF NOT EXISTS objectives_period_idx ON objectives.objectives(owner_user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS task_notes_owner_user_idx ON tasks.task_notes(owner_user_id);
CREATE INDEX IF NOT EXISTS task_notes_task_idx ON tasks.task_notes(task_id);
CREATE INDEX IF NOT EXISTS task_insights_owner_created_idx ON tasks.task_insights(owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS core_msg_conversation_idx ON core.agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS agent_conv_domain_updated_idx ON core.agent_conversations(user_id, domain, updated_at);
CREATE INDEX IF NOT EXISTS task_embeddings_task_id_idx ON tasks.task_embeddings(task_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON core.users(email);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON core.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON core.sessions(expires_at);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON core.audit_logs(actor_user_id, created_at);

CREATE TABLE IF NOT EXISTS wallet.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
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
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    type VARCHAR(10) NOT NULL,
    icon VARCHAR(30),
    parent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
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
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
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
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES wallet.savings_goals(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES wallet.transactions(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    note VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS wallet.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS health.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(8),
    cadence VARCHAR(12) NOT NULL DEFAULT 'daily',
    weekly_target INTEGER,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES health.habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_habit_date_idx ON health.habit_logs(habit_id, date);
CREATE INDEX IF NOT EXISTS habit_logs_owner_user_idx ON health.habit_logs(owner_user_id);
CREATE INDEX IF NOT EXISTS habits_owner_user_idx ON health.habits(owner_user_id);

CREATE TABLE IF NOT EXISTS health.counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(8),
    daily_cost NUMERIC(15, 2),
    started_at DATE NOT NULL,
    last_milestone_notified INTEGER NOT NULL DEFAULT 0,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health.counter_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    counter_id UUID NOT NULL REFERENCES health.counters(id) ON DELETE CASCADE,
    started_at DATE NOT NULL,
    ended_at DATE NOT NULL,
    days INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS counters_owner_user_idx ON health.counters(owner_user_id);
CREATE INDEX IF NOT EXISTS counter_attempts_counter_idx ON health.counter_attempts(counter_id);
CREATE INDEX IF NOT EXISTS counter_attempts_owner_user_idx ON health.counter_attempts(owner_user_id);

CREATE TABLE IF NOT EXISTS health.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    notes TEXT,
    target_date DATE NOT NULL,
    target_weight_kg NUMERIC(6, 2),
    status VARCHAR(12) NOT NULL DEFAULT 'active',
    deadline_notified VARCHAR(4) NOT NULL DEFAULT 'none',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goals_owner_user_idx ON health.goals(owner_user_id);
CREATE INDEX IF NOT EXISTS goals_status_idx ON health.goals(status);

CREATE TABLE IF NOT EXISTS health.weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS weight_entries_owner_date_idx ON health.weight_entries(owner_user_id, date);
CREATE INDEX IF NOT EXISTS weight_entries_owner_user_idx ON health.weight_entries(owner_user_id);

CREATE TABLE IF NOT EXISTS health.mood_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood INTEGER NOT NULL,
    energy INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS mood_check_ins_owner_date_idx ON health.mood_check_ins(owner_user_id, date);
CREATE INDEX IF NOT EXISTS mood_check_ins_owner_user_idx ON health.mood_check_ins(owner_user_id);

CREATE TABLE IF NOT EXISTS wallet.wallet_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES wallet.accounts(id),
    category_id UUID REFERENCES wallet.categories(id),
    type VARCHAR(10) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    description VARCHAR(255),
    day_of_month INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    last_run_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON wallet.categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_owner_user_idx ON wallet.categories(owner_user_id);
CREATE INDEX IF NOT EXISTS tx_owner_user_idx ON wallet.transactions(owner_user_id);
CREATE INDEX IF NOT EXISTS tx_account_date_idx ON wallet.transactions(account_id, date);
CREATE INDEX IF NOT EXISTS tx_category_date_idx ON wallet.transactions(category_id, date);
CREATE INDEX IF NOT EXISTS tx_transfer_to_account_idx ON wallet.transactions(transfer_to_account_id);
CREATE INDEX IF NOT EXISTS sc_goal_id_idx ON wallet.savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS sc_transaction_id_idx ON wallet.savings_contributions(transaction_id);
CREATE INDEX IF NOT EXISTS investments_owner_user_idx ON wallet.investments(owner_user_id);
CREATE INDEX IF NOT EXISTS investments_account_id_idx ON wallet.investments(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS exchange_rate_unique_idx
    ON wallet.exchange_rates(from_currency, to_currency, type, date);
CREATE INDEX IF NOT EXISTS wallet_insights_owner_created_idx ON wallet.wallet_insights(owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS recurring_owner_user_idx ON wallet.recurring_transactions(owner_user_id);
CREATE INDEX IF NOT EXISTS recurring_account_idx ON wallet.recurring_transactions(account_id);

CREATE TABLE IF NOT EXISTS core.file_blobs (
    ref UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content BYTEA NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical.records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    type VARCHAR(16) NOT NULL,
    title VARCHAR(160) NOT NULL,
    record_date DATE NOT NULL,
    professional VARCHAR(160),
    specialty VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES medical.records(id) ON DELETE CASCADE,
    filename VARCHAR(200) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_ref UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medical_records_owner_user_idx ON medical.records(owner_user_id);
CREATE INDEX IF NOT EXISTS medical_attachments_record_idx ON medical.attachments(record_id);
CREATE INDEX IF NOT EXISTS medical_attachments_owner_user_idx ON medical.attachments(owner_user_id);

`;

export const TEST_DATABASE_CONNECTION_STRING = 'postgresql://test:test@localhost:5433/vdp_test';

export class TestDatabase {
    public query;
    private pool: pg.Pool;

    constructor() {
        this.pool = new pg.Pool({ connectionString: TEST_DATABASE_CONNECTION_STRING });
        this.query = drizzle(this.pool, {
            schema: {
                ...authSchema,
                ...agentSchema,
                ...walletSchema,
                ...projectsSchema,
                ...objectivesSchema,
                ...tasksSchema,
                ...embeddingsSchema,
            },
        });
    }

    async setup(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(SETUP_SQL);
            await this.seedUsers(DEFAULT_TEST_USERS);
        } finally {
            client.release();
        }
    }

    async truncate(options?: { users?: readonly TestUser[] }): Promise<void> {
        const client = await this.pool.connect();
        try {
            // Fire-and-forget writes from the app (insight persistence, etc.)
            // can still be in flight when a test truncates; their FK checks on
            // core.users can deadlock against TRUNCATE's exclusive locks.
            // Postgres aborts one side (40P01) — retrying the truncate wins.
            await this.queryWithDeadlockRetry(
                client,
                `TRUNCATE
                    core.audit_logs,
                    core.sessions,
                    core.users,
                    core.agent_messages,
                    core.agent_conversations,
                    core.file_blobs,
                    medical.attachments,
                    medical.records,
                    tasks.task_embeddings,
                    tasks.task_notes,
                    tasks.task_insights,
                    tasks.daily_review_state,
                    tasks.tasks,
                    objectives.objectives,
                    projects.time_entries,
                    projects.projects,
                    projects.clients,
                    health.habit_logs,
                    health.habits,
                    health.counter_attempts,
                    health.counters,
                    health.goals,
                    health.weight_entries,
                    health.mood_check_ins,
                    wallet.wallet_insights,
                    wallet.recurring_transactions,
                    wallet.savings_contributions,
                    wallet.transactions,
                    wallet.investments,
                    wallet.exchange_rates,
                    wallet.savings_goals,
                    wallet.categories,
                    wallet.accounts
                 CASCADE`,
            );
            await this.seedUsers(options?.users ?? DEFAULT_TEST_USERS);
        } finally {
            client.release();
        }
    }

    private async queryWithDeadlockRetry(
        client: pg.PoolClient,
        sql: string,
        attempts = 3,
    ): Promise<void> {
        for (let attempt = 1; ; attempt++) {
            try {
                await client.query(sql);
                return;
            } catch (err: unknown) {
                const isDeadlock = (err as { code?: string }).code === '40P01';
                if (!isDeadlock || attempt >= attempts) throw err;
                await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
            }
        }
    }

    async seedUsers(users: readonly TestUser[]): Promise<void> {
        if (users.length === 0) return;

        const client = await this.pool.connect();
        try {
            for (const user of users) {
                await client.query(
                    `INSERT INTO core.users (id, email, display_name, password_hash, role, is_active)
                     VALUES ($1, $2, $3, 'test-password-hash', 'user', TRUE)
                     ON CONFLICT (id) DO NOTHING`,
                    [user.id, user.email, user.displayName],
                );
            }
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
            await client.query('DROP SCHEMA IF EXISTS projects CASCADE');
            await client.query('DROP SCHEMA IF EXISTS objectives CASCADE');
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
