-- Manual migration: HNSW index for semantic similarity search
-- Apply after the managed Drizzle baseline migration:
--   psql "$DATABASE_URL" -f src/manual-migrations/0001_task_embeddings_hnsw.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS task_embeddings_embedding_hnsw_idx
ON tasks.task_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
