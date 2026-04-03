-- Manual migration: Convert all timestamp columns to timestamptz
-- This migration is NOT managed by drizzle-kit (not in _journal.json).
-- Run manually: psql $DATABASE_URL -f 0006_timestamp_to_timestamptz.sql
--
-- Converts every `timestamp` (without time zone) column to `timestamptz`
-- across all schemas, treating existing values as UTC.

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- Tasks schema
-- ═══════════════════════════════════════════════════════════

-- tasks.tasks
ALTER TABLE tasks.tasks
  ALTER COLUMN completed_at TYPE timestamptz USING completed_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at   TYPE timestamptz USING created_at   AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at   TYPE timestamptz USING updated_at   AT TIME ZONE 'UTC';

ALTER TABLE tasks.tasks
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- tasks.task_notes
ALTER TABLE tasks.task_notes
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE tasks.task_notes
  ALTER COLUMN created_at SET DEFAULT now();

-- tasks.task_embeddings
ALTER TABLE tasks.task_embeddings
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE tasks.task_embeddings
  ALTER COLUMN created_at SET DEFAULT now();

-- ═══════════════════════════════════════════════════════════
-- Wallet schema
-- ═══════════════════════════════════════════════════════════

-- wallet.accounts
ALTER TABLE wallet.accounts
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE wallet.accounts
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- wallet.categories
ALTER TABLE wallet.categories
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE wallet.categories
  ALTER COLUMN created_at SET DEFAULT now();

-- wallet.transactions
ALTER TABLE wallet.transactions
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE wallet.transactions
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- wallet.savings_goals
ALTER TABLE wallet.savings_goals
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE wallet.savings_goals
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- wallet.investments
ALTER TABLE wallet.investments
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE wallet.investments
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- wallet.exchange_rates
ALTER TABLE wallet.exchange_rates
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE wallet.exchange_rates
  ALTER COLUMN created_at SET DEFAULT now();

-- ═══════════════════════════════════════════════════════════
-- Core schema (agent conversations & messages)
-- ═══════════════════════════════════════════════════════════

-- core.agent_conversations
ALTER TABLE core.agent_conversations
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE core.agent_conversations
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- core.agent_messages
ALTER TABLE core.agent_messages
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE core.agent_messages
  ALTER COLUMN created_at SET DEFAULT now();

COMMIT;
