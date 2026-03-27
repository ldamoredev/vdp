# VDP Database Review

**Date:** 2026-03-26
**Scope:** All migrations, Drizzle ORM schemas, repository implementations, service-layer query patterns, connection management, and security configuration.

---

## CRITICAL

### C-1: No HNSW/IVFFlat Index on the `embedding` Vector Column

**File:** `server/src/migrations/0002_light_lord_hawal.sql`

The `task_embeddings.embedding` column stores 768-dimensional vectors and is queried with cosine distance (`<=>`) in `findSimilar`. The migration creates only a btree index on `task_id` — which is irrelevant for vector search — and no ANN index on the embedding column itself.

Without an HNSW or IVFFlat index, every similarity search performs a sequential scan over the entire `task_embeddings` table, computing cosine distance for every row. This is O(n) and degrades linearly as the table grows.

```sql
-- Add after the existing migration
CREATE INDEX task_embeddings_embedding_hnsw_idx
ON tasks.task_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

The Drizzle schema at `server/src/modules/tasks/infrastructure/db/embeddings-schema.ts` also needs the index added so future `drizzle-kit generate` runs include it.

---

### C-2: `CarryOverAllPending` Executes N Sequential Database Round-Trips

**File:** `server/src/modules/tasks/services/CarryOverAllPending.ts`

```typescript
for (const task of pendingTasks) {
    const carried = await this.carryOverTask.execute(task.id, toDate);
```

`CarryOverTask.execute` does: `getTask` (SELECT) + `save` (UPDATE) + optional `emit` + `detectRepeatPattern.execute` (embedding query + N getTask calls). For each pending task you get at minimum 2 DB round-trips in serial. With 20 pending tasks that is 40+ sequential queries, no batching, no transaction.

The correct pattern is a single `UPDATE … WHERE scheduled_date = $date AND status = 'pending' RETURNING *` wrapped in a transaction, followed by batch embedding updates. At minimum the `getTask` in `CarryOverTask` is redundant since `CarryOverAllPending` already fetched the task objects.

---

### C-3: `GetDayStats.executeTrend` Executes N Sequential Full-Table Reads

**File:** `server/src/modules/tasks/services/GetDayStats.ts`

```typescript
for (let i = 0; i < days; i++) {
    results.push(await this.execute(localDateISO(date)));
    date.setDate(date.getDate() - 1);
}
```

`execute` calls `getTasksByDate` — a full select of all tasks for a given date. For 7-day trend this is 7 separate round-trips. `GetWeeklySummary` and `GetPlanningContext` both call `executeTrend(7)`, meaning the weekly summary endpoint performs 7 sequential DB queries where one query with `GROUP BY scheduled_date` would suffice.

---

### C-4: `DetectRepeatPattern` — N+1 Query Pattern

**File:** `server/src/modules/tasks/services/DetectRepeatPattern.ts`

```typescript
const historyPromises = historicalIds.map(id => this.repository.getTask(id));
const history = (await Promise.all(historyPromises)).filter(...)
```

This issues one `SELECT` per similar task found. While `Promise.all` parallelises them, each is still a separate DB round-trip. The correct fix is `WHERE id = ANY($1::uuid[])` — a single query fetching all records at once. The `TaskRepository` interface needs a `getTasksByIds(ids: string[])` method.

---

### C-5: `task_notes` FK Has `ON DELETE NO ACTION` — Manual Deletion Required in Application Code

**File:** `server/src/migrations/0000_robust_spectrum.sql`, line 219

```sql
ALTER TABLE "tasks"."task_notes" ADD CONSTRAINT ... ON DELETE no action
```

`DeleteTask` manually deletes notes before deleting the task. This is a data integrity time bomb: any code path that deletes a task without going through `DeleteTask` — direct DB calls, future services, migrations — will hit a FK violation. The FK should be `ON DELETE CASCADE` (matching how `task_embeddings` handles it). The manual deletion in `DeleteTask` can then be removed.

---

## HIGH

### H-1: `timestamp` Used Everywhere Instead of `timestamptz`

**Files:** All schemas and migrations

Every `created_at`, `updated_at`, `completed_at`, `scheduled_at`, `taken_at`, `recorded_at`, `health_metrics.recorded_at` column uses `timestamp` (without timezone). PostgreSQL stores and returns these without any timezone information. If the server runs in UTC and the user is in UTC-3, times stored at creation will be interpreted incorrectly on retrieval.

Drizzle's `timestamp()` maps to `timestamp without time zone`. The fix is `timestamp({ withTimezone: true })` or `timestamptz` in raw SQL. This requires a migration to alter all timestamp columns. `date` columns (scheduled_date, start_date, etc.) are fine since they carry no time component.

---

### H-2: Connection Pool Has No Explicit Limits or Timeouts

**File:** `server/src/modules/common/base/db/Database.ts`

```typescript
const pool = new pg.Pool({
    connectionString: connectionString ?? process.env.DATABASE_URL,
});
```

No `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`, or `statement_timeout` are configured. More importantly:

- No `connectionTimeoutMillis` means a connection attempt can hang indefinitely if the DB is unreachable.
- No `idleTimeoutMillis` means connections are held open forever.
- No `statement_timeout` means a slow query (e.g., an unindexed vector scan) blocks the connection indefinitely.

Supabase on the free/pro tier uses PgBouncer in transaction mode. Drizzle with `node-postgres` Pool bypasses PgBouncer unless `DATABASE_URL` points at PgBouncer's port (6543, not 5432).

Recommended configuration:

```typescript
const pool = new pg.Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});
```

---

### H-3: `wallet.categories.parent_id` FK Has No Index and No Referential Constraint

**File:** `server/src/modules/wallet/schema.ts`, line 39

```typescript
parentId: uuid("parent_id"),
```

`parent_id` is a self-referencing FK column (for category hierarchies) but:
1. No `references(() => categories.id)` is declared in the Drizzle schema — the FK constraint does not exist in the database.
2. No index on `parent_id` — any query joining categories to their parent will seq-scan.

The missing FK means orphaned parent_ids are possible. The missing index means hierarchy traversals are O(n).

---

### H-4: `wallet.savingsContributions` Has No Indexes on FK Columns

**File:** `server/src/modules/wallet/schema.ts`, lines 92-104

`savings_contributions` has FKs on `goal_id` and `transaction_id` with no indexes. Queries filtering by `goal_id` (e.g., "show contributions for this savings goal") will seq-scan the table. There is also no `date` index, so date-range queries scan the full table.

---

### H-5: `wallet.investments.account_id` FK Has No Index

**File:** `server/src/modules/wallet/schema.ts`, line 111

`account_id` is a nullable FK with no index. Queries joining investments to accounts will full-scan `investments`.

---

### H-6: `drizzle.config.ts` Has Wallet and Health Schemas Commented Out

**File:** `server/drizzle.config.ts`

```typescript
schema: [
    "./src/modules/common/infrastructure/agents/schema.ts",
    // "./src/modules/wallet/schema.ts",
    // "./src/modules/health/schema.ts",
    "./src/modules/tasks/infrastructure/db/schema.ts",
    "./src/modules/tasks/infrastructure/db/embeddings-schema.ts",
],
```

The wallet and health schemas are commented out of the Drizzle config. This means `drizzle-kit generate` and `drizzle-kit migrate` will not manage those tables. Any future schema change to `wallet` or `health` must be written as raw SQL by hand, risking drift between the TypeScript schema definitions and the actual database.

---

### H-7: `agent_messages` Has No `ON DELETE CASCADE` from `agent_conversations`

**File:** `server/src/migrations/0000_robust_spectrum.sql`, line 210

```sql
ON DELETE no action
```

Deleting a conversation will fail with a FK violation unless all messages are deleted first. There is no `deleteConversation` method in `DrizzleAgentRepository`. This should be `ON DELETE CASCADE`.

---

## MEDIUM

### M-1: `listTasks` Uses OFFSET Pagination

**File:** `server/src/modules/tasks/infrastructure/db/DrizzleTaskRepository.ts`, line 50

OFFSET pagination requires the DB to scan and discard all prior rows. For small datasets this is acceptable, but high-offset queries degrade. Cursor-based pagination (`WHERE id > $last_id ORDER BY id`) is O(log n) vs O(n). Given tasks are filtered by `scheduled_date` (a bounded set by design), the practical impact is low, but the API exposes `offset` as an unbounded parameter.

---

### M-2: No Composite Index for the Dominant `(scheduled_date, status)` Query Pattern

**File:** `server/src/modules/tasks/infrastructure/db/DrizzleTaskRepository.ts`, lines 43-55

The three separate indexes on `scheduled_date`, `status`, and `domain` help single-column filters. The most common query — "all pending tasks for today" — uses `scheduled_date AND status`. PostgreSQL can use only one index per table access without bitmap index scans. A composite index would be more efficient:

```sql
CREATE INDEX tasks_date_status_idx ON tasks.tasks (scheduled_date, status);
```

---

### M-3: `findSimilar` Computes Cosine Distance Twice Per Row

**File:** `server/src/modules/tasks/infrastructure/db/DrizzleTaskEmbeddingRepository.ts`, lines 34-43

```sql
WHERE 1 - (embedding <=> ${vectorLiteral}::vector) > ${threshold}
ORDER BY embedding <=> ${vectorLiteral}::vector
```

The cosine distance is computed twice per row. A CTE would compute it once:

```sql
WITH scored AS (
    SELECT task_id, content, 1 - (embedding <=> $1::vector) AS similarity
    FROM tasks.task_embeddings
)
SELECT * FROM scored WHERE similarity > $2 ORDER BY similarity DESC LIMIT $3
```

---

### M-4: `CheckDailyCompletion` Fires Two Separate COUNT Queries

**File:** `server/src/modules/tasks/services/CheckDailyCompletion.ts`

```typescript
const pendingCount = await this.repository.countByDateAndStatus(date, "pending");
if (pendingCount === 0) {
    const doneCount = await this.repository.countByDateAndStatus(date, "done");
```

Two round-trips that can be collapsed into one:

```sql
SELECT
    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE status = 'done') AS done
FROM tasks.tasks
WHERE scheduled_date = $1
```

---

### M-5: `updateTask` Spreads Untrusted Keys Directly into the Query

**File:** `server/src/modules/tasks/infrastructure/db/DrizzleTaskRepository.ts`, lines 83-86

```typescript
const updateData: Record<string, unknown> = { updatedAt: new Date() };
for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) updateData[k] = v;
}
```

The key names from `data` are used as-is to build the update payload. If `UpdateTaskData` is ever widened, or if TypeScript types are bypassed (`as any`), arbitrary column names could be injected. Prefer an explicit allowlist of fields.

---

### M-6: Test Database Has Mismatched Embedding Dimensions

**File:** `server/src/modules/tasks/__tests__/integration/test-database.ts`, line 55

```sql
embedding vector(384) NOT NULL,
```

Production uses `vector(768)` (defined in `embeddings-schema.ts` as `EMBEDDING_DIMENSIONS = 768`). The test database uses `vector(384)`. Integration tests will silently pass with wrong-dimension data that would fail in production. This should use the shared constant.

---

### M-7: No Index on `wallet.transactions.transfer_to_account_id`

**File:** `server/src/modules/wallet/schema.ts`, line 57

`transfer_to_account_id` is a nullable FK referencing `accounts` with no index. Queries finding all transfers to a given account will full-scan the transactions table.

---

### M-8: `agentConversations.domain` Column Has No Index

**File:** `server/src/modules/common/infrastructure/agents/schema.ts`

`listConversations` filters by `domain` and orders by `updated_at`:

```typescript
.where(eq(agentConversations.domain, domain))
.orderBy(desc(agentConversations.updatedAt))
```

No index exists on `(domain, updated_at)`. This will seq-scan `agent_conversations` on every agent page load.

---

## LOW

### L-1: `varchar(255)` Used Where `text` Is More Appropriate

**File:** `server/src/modules/wallet/schema.ts`, line 102

PostgreSQL's `text` and `varchar(n)` have identical storage performance. Using `varchar(255)` is a MySQL carryover. Prefer `text` unless there is a business rule enforcing the length.

---

### L-2: `wallet.accounts` and `wallet.savings_goals` Have No Index on `is_active`

Both tables have an `is_active` boolean commonly used as a filter. A partial index would be beneficial:

```sql
CREATE INDEX accounts_active_idx ON wallet.accounts (id) WHERE is_active = true;
```

---

### L-3: `health.habits` Has No Index on `is_active`

Same pattern as L-2 for the `habits` table.

---

### L-4: `ACCESS_SECRET` Transmitted as Query Parameter Risks Logging Exposure

**File:** `server/src/modules/common/http/BasicHttpAuthentication.ts`, line 18

```typescript
const apiKey = request.headers['x-api-key']
    ?? (request.query as Record<string, string>)?.api_key;
```

The fallback allows the API key to be passed as `?api_key=...` in the query string. Query strings appear in server access logs, browser history, proxy logs, and referrer headers. The query parameter fallback should be removed, leaving only the `x-api-key` header.

---

### L-5: No `statement_timeout` Configured at the Session Level

No per-query or per-session timeout is configured. A pathological vector similarity query with no ANN index (see C-1) can hold a connection open for minutes. Setting `statement_timeout = '30s'` would bound this.

---

## Summary Table

| ID | Severity | Area | Description |
|----|----------|------|-------------|
| C-1 | CRITICAL | Performance | No HNSW/IVFFlat index on vector embedding column |
| C-2 | CRITICAL | Performance | `CarryOverAllPending` N serial DB round-trips |
| C-3 | CRITICAL | Performance | `GetDayStats.executeTrend` N sequential full-table reads |
| C-4 | CRITICAL | Performance | `DetectRepeatPattern` N+1 query pattern |
| C-5 | CRITICAL | Integrity | `task_notes` FK `ON DELETE NO ACTION` — fragile app-layer deletion |
| H-1 | HIGH | Schema | All timestamps use `timestamp` instead of `timestamptz` |
| H-2 | HIGH | Connection | Pool has no max, idle timeout, or connection timeout |
| H-3 | HIGH | Schema | `categories.parent_id` — no FK constraint, no index |
| H-4 | HIGH | Performance | `savings_contributions` — no indexes on FK columns |
| H-5 | HIGH | Performance | `investments.account_id` FK has no index |
| H-6 | HIGH | Migrations | Wallet/health schemas excluded from `drizzle.config.ts` |
| H-7 | HIGH | Integrity | `agent_messages` FK `ON DELETE NO ACTION` — blocks deletion |
| M-1 | MEDIUM | Performance | OFFSET pagination with no upper bound |
| M-2 | MEDIUM | Performance | No composite index for `(scheduled_date, status)` |
| M-3 | MEDIUM | Performance | Vector similarity computed twice per row |
| M-4 | MEDIUM | Performance | Two COUNT queries where one suffices |
| M-5 | MEDIUM | Security | Dynamic key spread in `updateTask` |
| M-6 | MEDIUM | Testing | Test DB embedding dimensions mismatch (384 vs 768) |
| M-7 | MEDIUM | Performance | `transfer_to_account_id` FK has no index |
| M-8 | MEDIUM | Performance | `agent_conversations.domain` has no index |
| L-1 | LOW | Schema | `varchar(255)` where `text` is more appropriate |
| L-2 | LOW | Performance | No partial index on `accounts.is_active` |
| L-3 | LOW | Performance | No partial index on `habits.is_active` |
| L-4 | LOW | Security | API key accepted in query string |
| L-5 | LOW | Connection | No `statement_timeout` configured |

---

## Priority Action Plan

**Do first (production correctness):**
1. Add HNSW index on `task_embeddings.embedding` (C-1)
2. Change `task_notes` FK to `ON DELETE CASCADE` (C-5)
3. Configure pool limits and timeouts in `Database.ts` (H-2)
4. Fix embedding dimensions in test database (M-6)

**Do next (query consolidation):**
5. Batch `CarryOverAllPending` into a single UPDATE (C-2)
6. Replace `executeTrend` loop with a single grouped query (C-3)
7. Replace N+1 in `DetectRepeatPattern` with `getTasksByIds` (C-4)
8. Add composite index `(scheduled_date, status)` on tasks (M-2)
9. Add `(domain, updated_at)` index on `agent_conversations` (M-8)
10. Fix recomputed cosine distance in `findSimilar` with a CTE (M-3)

**Schema corrections:**
11. Add wallet and health schemas back to `drizzle.config.ts` (H-6)
12. Migrate all `timestamp` columns to `timestamptz` (H-1)
13. Fix `categories.parent_id` FK and index (H-3)
14. Add indexes to `savings_contributions`, `investments`, `transfer_to_account_id` (H-4, H-5, M-7)
15. Remove query-string API key fallback (L-4)
