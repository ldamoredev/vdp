# CLAUDE.md

**[`AGENTS.md`](./AGENTS.md) is the source of truth** for architecture, module rules,
auth-context rules, database discipline, cross-domain patterns, safety, and
verification. Read it before making changes; do not restate or fork its rules here.
If a doc drifts from `AGENTS.md`, fix `AGENTS.md` first, then reconcile.

Priorities live in [`ROADMAP.md`](./ROADMAP.md) (forward-looking only). Setup and
commands live in [`README.md`](./README.md). System shape and per-module procedures
live in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md).

## Working agreement (short form)

- Work directly on `main`. No branches or PRs unless the owner asks.
- One ROADMAP feature per session, shipped complete through the per-feature gate,
  then STOP and summarize.
- Never commit or stage unless the owner explicitly says so. When they do: logical
  commits (backend / frontend / docs), imperative messages explaining the why.
- Verify locally before claiming done (see `AGENTS.md` §Verification), then a manual
  browser smoke; clean up smoke data afterwards.

## Skills

Skills in `.claude/skills/` auto-trigger for Claude Code:

- `code-review` — always-on guard: review the working-tree diff before ANY commit or
  push; findings block until reported to the owner.
- `tdd-workflow` — always-on guard: drive changes test-first (unit/social tests).
- `create-service-api`, `create-service-web`, `create-presenter-web`,
  `create-aggregate`, `create-agent-tool` — generators; follow the matching one when
  scaffolding that kind of unit.

## Dev quickstart

- Postgres dev DB: `docker start vdp-postgres-dev` (port 55432, `vdp:vdp`, db `vdp`).
  Migrations: `DATABASE_URL='postgresql://vdp:vdp@localhost:55432/vdp' pnpm db:migrate`
  from `server/`. No other local infra (no Redis, no Jaeger, no docker-compose for dev).
- Tests use a separate ephemeral DB: `pnpm --filter @vdp/server db:test:up` first.
- App: `pnpm dev` (Vite proxies `/api` to Fastify on :4000).
- Checks: `pnpm typecheck` (or `typecheck:web` / `typecheck:server` targeted),
  `pnpm lint`, targeted tests per `AGENTS.md` §Verification.
- Never read or print `.env*`, `.key`, `.pem`, `.secret`, or
  `.claude/dev-credentials.env`.
