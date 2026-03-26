-- Manual migration: query performance indexes
-- Run manually on production: psql $DATABASE_URL -f 0004_query_performance.sql
-- Not managed by drizzle-kit (no entry in _journal.json)

-- Composite index for the most common query pattern: tasks by date + status
CREATE INDEX IF NOT EXISTS tasks_date_status_idx
ON tasks.tasks (scheduled_date, status);

-- Index for agent conversation lookups by domain ordered by recency
CREATE INDEX IF NOT EXISTS agent_conv_domain_updated_idx
ON core.agent_conversations (domain, updated_at);
