-- ⚠️  MANUAL MIGRATION — not managed by drizzle-kit
-- Run directly against the database: psql $DATABASE_URL -f 0003_production_hotfixes.sql
-- Reason: Drizzle ORM cannot express HNSW indexes or ALTER CONSTRAINT operations.
-- The corresponding Drizzle schemas have been updated to match these changes.

-- 3.0.2: Add HNSW index on task_embeddings.embedding for vector similarity search
-- Without this, every findSimilar call does a sequential scan (O(n))
-- Note: CONCURRENTLY removed — cannot run inside a transaction block.
-- On a small table this is fine; for large tables, run CONCURRENTLY outside a transaction.
CREATE INDEX IF NOT EXISTS task_embeddings_embedding_hnsw_idx
ON tasks.task_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3.0.3: Change task_notes FK to ON DELETE CASCADE
-- Prevents FK violation when deleting tasks outside DeleteTask service
ALTER TABLE "tasks"."task_notes"
  DROP CONSTRAINT "task_notes_task_id_tasks_id_fk",
  ADD CONSTRAINT "task_notes_task_id_tasks_id_fk"
    FOREIGN KEY ("task_id") REFERENCES "tasks"."tasks"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- 3.0.4: Change agent_messages FK to ON DELETE CASCADE
-- Allows deleting conversations without manually deleting messages first
ALTER TABLE "core"."agent_messages"
  DROP CONSTRAINT "agent_messages_conversation_id_agent_conversations_id_fk",
  ADD CONSTRAINT "agent_messages_conversation_id_agent_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "core"."agent_conversations"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
