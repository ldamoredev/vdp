# Backup, Restore Verification, and Owner Data Export

Operational runbook for F1.1. All three procedures are **owner-run** — agent sessions
deliver and maintain these scripts but never execute them against production
(AGENTS.md §Current Sequencing: deploy-adjacent operations are owner-run).

## What is covered

- The **database backup** covers everything VDP owns: all domain schemas, `core`
  (users/sessions/audit/agent conversations/app settings), `core.file_blobs`
  (medical attachment binaries live in Postgres via `PostgresFileStorage`), and the
  `drizzle` migration journal. No separate file storage to back up. The dump is
  deliberately **schema-scoped** — Supabase-managed schemas (auth, storage, vault,
  extensions) are excluded because nothing of VDP's lives there and their
  proprietary extensions would break restores outside Supabase.
- The **owner export** produces portable per-domain JSON (+ medical attachment
  files) for one user. It deliberately excludes `core` (operational data — covered
  by the backup) and `tasks.task_embeddings` (derived vectors, regenerable).

## 1. Backup (run against prod)

```bash
DATABASE_URL='<supabase-connection-string>' ./scripts/backup-db.sh [backup-dir] [keep-n]
# defaults: backup-dir=backups/, keep-n=14
```

- Use the **Session pooler** connection string. For this project it is
  `postgresql://postgres.gdukarnfzczznzeelqru:<password>@aws-1-us-east-1.pooler.supabase.com:5432/postgres`
  (verified 2026-07-06; the dashboard shows it under Connect → Session pooler).
  Do NOT use the direct host (`db.<ref>.supabase.co`) — it is IPv6-only and
  unreachable from Docker on macOS ("Cannot assign requested address"). Do NOT
  use the transaction pooler (port 6543) — it breaks `pg_dump`. The pooler
  username is `postgres.<project-ref>`, not plain `postgres`. URL-encode special
  characters in the password.
- The script writes `backups/vdp-<timestamp>.dump` (pg_dump custom format,
  compressed), sanity-checks the archive, and prunes to the newest `keep-n` dumps.
- **No local Postgres client needed**: `pg_dump` runs inside a `postgres:17`
  Docker container, so client/server version mismatches cannot happen. Only
  Docker is required. `localhost`/`127.0.0.1` in `DATABASE_URL` is rewritten to
  `host.docker.internal` automatically (macOS).
- Cadence: run it before every deploy that includes migrations, and at least
  weekly while the app is in daily use. The backup dir is local to your machine —
  keep at least one copy on a second disk/location.
- `backups/` must never be committed (contains all personal data). It is
  gitignored; verify before any commit if you change the target dir.

## 2. Restore verification

```bash
./scripts/restore-verify.sh backups/vdp-<timestamp>.dump
```

Spins up a disposable Postgres 17 container with pgvector (`vdp-restore-verify-*`),
restores the dump inside it with `--exit-on-error` (no local client tools needed),
prints exact per-table row counts for every schema, and fails if `core.users` is
empty. The container is removed automatically on exit.

Run this at least once after setting up backups, and again whenever the schema
changes shape significantly (new schema, new extension). A backup that was never
restored is a hope, not a backup.

## 3. Owner data export (per-domain JSON)

```bash
cd server
DATABASE_URL='<connection-string>' \
  pnpm exec tsx src/scripts/export-owner-data.ts lautidamore@gmail.com [outDir]
# outDir defaults to ./vdp-export-<timestamp>/
```

Output layout:

```text
<outDir>/
├── manifest.json          # who/when + per-table row counts + skipped tables
├── tasks.json             # { "tasks.tasks": [...], "tasks.task_notes": [...], ... }
├── wallet.json            # includes wallet.exchange_rates (global reference data)
├── health.json
├── medical.json           # records + attachment metadata
├── projects.json
├── objectives.json
├── inbox.json
└── medical-attachments/<record-id>/<filename>   # attachment binaries
```

Safety properties:

- **Owner-scoped**: every table is filtered by `owner_user_id`; covered by
  cross-user isolation tests (`server/src/scripts/__tests__/integration/`).
- **Drift-proof**: the exporter compares the live schema against the explicit
  registry in `server/src/scripts/export/export-registry.ts` and refuses to run if
  any domain table is unclassified. Adding a table without classifying it there
  breaks the export loudly, never silently.
- The export contains all personal data including medical. Treat the output dir
  like the backup dir: local only, never committed, delete when no longer needed.

## Maintenance

- New domain table → classify it in `export-registry.ts` (mode `owner`, `global`,
  or `skip` with a reason). The integration suite and the runtime check both fail
  until you do.
- New schema → add it to `EXPORT_SCHEMAS` and to the schema list in
  `scripts/restore-verify.sh`.
