# CLAUDE.md

**[`AGENTS.md`](./AGENTS.md) is the source of truth** for architecture, module rules,
auth-context rules, database discipline, cross-domain patterns, safety, and
verification. Read it before making changes; do not restate or fork its rules here.
If a doc drifts from `AGENTS.md`, fix `AGENTS.md` first, then reconcile.

Priorities live in [`ROADMAP.md`](./ROADMAP.md) (forward-looking only). Setup and
commands live in [`README.md`](./README.md). System shape and per-module procedures
live in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md).

## Working agreement (short form)

Full protocol in [`docs/WORKFLOW.md`](./docs/WORKFLOW.md); rules in `AGENTS.md`
§Working Agreement.

- **Implementation session** (dev agent): one ROADMAP item, on a feature branch
  (`feat/<item-id>-<slug>`), through the per-feature gate; verify → self
  code-review → logical conventional commits → push branch → `gh pr create` →
  STOP and summarize. Never push `main`, never merge, never deploy.
- **Architect session** (owner + an approved Architect model: Claude Code Opus 4.8,
  Fable 5, or Codex GPT-5.6 Sol): scoping, PR review, docs; all three models hold
  the same Architect role. Commits to `main` are docs/scoping-only and require the
  owner's explicit ask.
- Blocked on a product decision → note it in `ROADMAP.md` §Needs owner decision
  with a recommendation; continue with what's decidable.

## Skills

Skills in `.claude/skills/` auto-trigger for Claude Code:

- `code-review` — always-on guard: review the working-tree diff before ANY commit or
  push; findings block until reported to the owner.
- `tdd-workflow` — always-on guard: drive changes test-first (unit/social tests).
- `open-pr` — close a verified slice into a reviewable PR; ALWAYS stops at the PR,
  never merges (merge is owner-only after Architect review).
- `checkpoint` / `orient` — session continuity via `STATUS.md`: `checkpoint` writes
  in-flight state at session end (use when wrapping up or a chat gets long), `orient`
  reads it at session start ("where were we?"). `STATUS.md` ≠ `ROADMAP.md` ≠ memory.
- `workflow-retro` — Architect-only: periodic audit of the workflow itself (skills,
  hooks, docs, memory); prune rules that stopped paying rent. Run on "retro".
- `smoke-verify` — pre-merge procedure: the manual browser smoke + surgical cleanup,
  owner-run at PR review time (the owner uses the dev account with real data).
- `create-handler-api`, `create-handler-web`, `create-presenter-web`,
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
