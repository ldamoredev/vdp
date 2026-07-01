# VDP — Vida Digital Personal

A modular personal AI operating system.

Active domains: `Tasks`, `Wallet`, `Health`, `Projects`, `Objectives`, `Inbox`. See
[`ROADMAP.md`](./ROADMAP.md)'s Scope Snapshot for current per-domain backend/frontend/
agent status. `People`, `Work`, and `Study` exist only as disabled demo pages.

## Production

| Service | URL | Provider |
|---------|-----|----------|
| App (SPA + API) | https://vdpapp.com.ar | Railway (Docker, single service) |
| Database | PostgreSQL + pgvector | Supabase (free tier) |
| LLM | — (not configured) | Agent chat is disabled in prod; configure a provider locally to use it |

Authentication now uses first-party users with email/password plus server-managed sessions.

The web app authenticates through same-origin auth routes and an `httpOnly` `vdp_session` cookie.

## Workspace

```
vdp/
├── apps/web/          # Vite SPA frontend (React 19 + react-router 7)
├── server/            # Fastify 5 backend
└── packages/shared/   # Zod schemas + TypeScript types
```

Monorepo managed with **pnpm workspaces** + **Turborepo**.

<!-- AUTO-GENERATED:SCRIPTS -->
## Available Commands

### Root (monorepo)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers (Turbo) |
| `pnpm build` | Build all packages (Turbo) |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm typecheck` | Typecheck shared, web, and server packages |
| `pnpm lint` | Run ESLint across the workspace |
| `pnpm test` | Run web tests, server unit tests, and server integration tests |
| `pnpm test:unit` | Run web tests and server unit tests |
| `pnpm test:integration` | Run server integration tests |
| `pnpm test:e2e` | Run server and web E2E tests |
| `pnpm clean` | Remove all node_modules, dist, .turbo |

### Server (`@vdp/server`)

| Command | Description |
|---------|-------------|
| `pnpm --filter @vdp/server dev` | Start backend with hot reload (tsx watch) |
| `pnpm --filter @vdp/server build` | Compile TypeScript to dist/ |
| `pnpm --filter @vdp/server start` | Run compiled server (tsx dist/index.js) |
| `pnpm --filter @vdp/server test` | Run all tests (unit + integration + e2e) |
| `pnpm --filter @vdp/server test:unit` | Run unit tests only |
| `pnpm --filter @vdp/server test:integration` | Run integration tests (requires test DB) |
| `pnpm --filter @vdp/server test:e2e` | Run E2E tests (requires test DB) |
| `pnpm --filter @vdp/server db:test:up` | Start test database (port 5433, tmpfs) |
| `pnpm --filter @vdp/server db:test:down` | Stop test database |

### Web (`@vdp/web`)

| Command | Description |
|---------|-------------|
| `pnpm --filter @vdp/web dev` | Start frontend on port 3000 |
| `pnpm --filter @vdp/web build` | Production build (standalone output) |
| `pnpm --filter @vdp/web start` | Serve production build on port 3000 |
| `pnpm --filter @vdp/web test` | Run frontend tests |
| `pnpm --filter @vdp/web test:watch` | Run frontend tests in watch mode |
<!-- END:AUTO-GENERATED:SCRIPTS -->

## Local Setup

### Prerequisites

- Node.js 24 (`nvm use` reads `.nvmrc`)
- pnpm 11.5.2 (`corepack enable && corepack prepare pnpm@11.5.2 --activate`)
- A PostgreSQL 16+ instance with the `pgvector` extension enabled, however you run it
  (a local install, a single `docker run pgvector/pgvector:pg16` container, or a
  hosted instance). There is no bundled dev-infra orchestration — just point
  `DATABASE_URL` at it.

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env files
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Set DATABASE_URL in server/.env to your Postgres instance
# DATABASE_URL=postgresql://vdp:vdp@localhost:5432/vdp

# 4. Run migrations
pnpm db:migrate

# 5. Start dev servers
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

<!-- AUTO-GENERATED:ENV -->
## Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `TEST_DATABASE_URL` | Tests only | — | Test database connection string |
| `PORT` | No | `4000` | Server port |
| `NODE_ENV` | No | `development` | Environment (`development` / `production`) |
| `CORS_ORIGIN` | No | _(allow all)_ | Comma-separated allowed origins |

**Agent Provider (pick one):**

| Variable | Description |
|----------|-------------|
| `AGENT_PROVIDER` | `ollama` (default), `anthropic`, or `openai-compatible` |
| `OLLAMA_BASE_URL` | Ollama URL (default: `http://127.0.0.1:11434`) |
| `OLLAMA_MODEL` | Ollama model (default: `qwen3:4b`) |
| `ANTHROPIC_API_KEY` | Anthropic API key (required if provider = anthropic) |
| `OPENAI_COMPAT_BASE_URL` | OpenAI-compatible base URL (e.g., `https://api.groq.com/openai`) |
| `OPENAI_COMPAT_API_KEY` | OpenAI-compatible API key |
| `OPENAI_COMPAT_MODEL` | Model name (default: `llama-3.3-70b-versatile`) |

**Embeddings (optional):**

| Variable | Description |
|----------|-------------|
| `EMBEDDING_PROVIDER` | `ollama` to enable (default: noop) |
| `EMBEDDING_MODEL` | Embedding model (default: `nomic-embed-text`) |

**Observability (optional):**

| Variable | Description |
|----------|-------------|
| `OTEL_ENABLED` | Enable OpenTelemetry (`true`/`false`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP HTTP endpoint |
| `OTEL_SERVICE_NAME` | Service name for traces |
| `LANGFUSE_SECRET_KEY` | Langfuse secret key |
| `LANGFUSE_PUBLIC_KEY` | Langfuse public key |
| `LANGFUSE_HOST` | Langfuse host URL |

### Web

The SPA calls the API same-origin (no env needed). In dev, Vite proxies `/api` to the backend; override the target with `VITE_API_PROXY_TARGET` (default `http://localhost:4000`). In production the Fastify server serves the SPA build (`WEB_DIST_PATH` overrides the dist location).
<!-- END:AUTO-GENERATED:ENV -->

<!-- AUTO-GENERATED:API -->
## API Reference

Base URL: `/api/v1`

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (public, no auth) |

### Tasks — CRUD

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tasks` | List tasks (filters: scheduledDate, status, domain, priority, limit, offset) |
| `GET` | `/api/v1/tasks/:id` | Get single task |
| `POST` | `/api/v1/tasks` | Create task (body: title, description?, priority?, scheduledDate?, domain?) |
| `PUT` | `/api/v1/tasks/:id` | Update task fields |
| `DELETE` | `/api/v1/tasks/:id` | Delete task |

### Tasks — Status Transitions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/tasks/:id/complete` | Mark task as done |
| `POST` | `/api/v1/tasks/:id/carry-over` | Reschedule to another date (body: toDate?) |
| `POST` | `/api/v1/tasks/:id/discard` | Discard task |
| `POST` | `/api/v1/tasks/carry-over-all` | Carry over all pending from a date (body: fromDate, toDate?) |

### Tasks — Notes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tasks/:id/notes` | Get notes for a task |
| `POST` | `/api/v1/tasks/:id/notes` | Add note (body: content, type?) |

### Tasks — Stats & Review

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tasks/review` | End-of-day review (query: date?) |
| `GET` | `/api/v1/tasks/review/state` | Daily ritual ceremony state (query: date) — note, acknowledged signals, morning focus, brief-requested flags |
| `PUT` | `/api/v1/tasks/review/state` | Save the full daily ritual state |
| `POST` | `/api/v1/tasks/review/brief-requested` | Narrow, idempotent mark that a brief surface (`morning`/`evening`/`weekly`) was already requested for a date (body: date, surface) |
| `GET` | `/api/v1/tasks/stats/today` | Today's completion stats |
| `GET` | `/api/v1/tasks/stats/trend` | Completion trend (query: days?, default 7) |
| `GET` | `/api/v1/tasks/stats/by-domain` | Stats grouped by domain (query: from?, to?) |
| `GET` | `/api/v1/tasks/stats/carry-over` | Carry-over rate (query: days?, default 7) |

### Tasks — Agent

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tasks/agent/conversations` | List agent conversations |
| `GET` | `/api/v1/tasks/agent/conversations/:id/messages` | Get conversation messages |
| `POST` | `/api/v1/tasks/agent/chat` | Chat with tasks agent (SSE stream response) |

### Tasks — Real-time

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tasks/insights/stream` | Server-Sent Events for task insights |

### Wallet — Accounts, Categories, Transactions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/wallet/accounts` | List accounts |
| `POST` | `/api/v1/wallet/accounts` | Create account |
| `PUT` | `/api/v1/wallet/accounts/:id` | Update account |
| `DELETE` | `/api/v1/wallet/accounts/:id` | Delete account |
| `GET` | `/api/v1/wallet/categories` | List categories (query: type?) |
| `POST` | `/api/v1/wallet/categories` | Create category |
| `GET` | `/api/v1/wallet/transactions` | List transactions (filters: from, to, type, categoryId, accountId, limit, offset) |
| `POST` | `/api/v1/wallet/transactions` | Create transaction |
| `PUT` | `/api/v1/wallet/transactions/:id` | Update transaction |
| `DELETE` | `/api/v1/wallet/transactions/:id` | Delete transaction |

### Wallet — Stats

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/wallet/stats/summary` | Income/expense/net balance (query: from?, to?, currency?) |
| `GET` | `/api/v1/wallet/stats/by-category` | Spending grouped by category (query: from?, to?, currency?) |
| `GET` | `/api/v1/wallet/stats/monthly-trend` | Monthly income/expense trend (query: year?, currency?) |
| `GET` | `/api/v1/wallet/stats/food-this-week` | This week's eating-out/delivery spend (feeds the Health diet-goal card) |

### Wallet — Savings, Investments, Exchange Rates, Recurring

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/wallet/savings` | List savings goals |
| `POST` | `/api/v1/wallet/savings` | Create savings goal |
| `PUT` | `/api/v1/wallet/savings/:id` | Update savings goal |
| `POST` | `/api/v1/wallet/savings/:id/contribute` | Log a contribution (body: amount, date?, note?, transactionId?) |
| `GET` | `/api/v1/wallet/investments` | List investments |
| `POST` | `/api/v1/wallet/investments` | Create investment |
| `PUT` | `/api/v1/wallet/investments/:id` | Update investment |
| `GET` | `/api/v1/wallet/exchange-rates/latest` | Latest ARS/USD rates by type |
| `POST` | `/api/v1/wallet/exchange-rates` | Record a manual rate |
| `POST` | `/api/v1/wallet/exchange-rates/refresh` | Refresh rates from the external provider |
| `GET` | `/api/v1/wallet/recurring` | List recurring transaction rules |
| `POST` | `/api/v1/wallet/recurring` | Create recurring rule |
| `DELETE` | `/api/v1/wallet/recurring/:id` | Delete recurring rule |
| `POST` | `/api/v1/wallet/recurring/materialize` | Materialize due occurrences into real transactions |

### Wallet — Agent

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/wallet/agent/conversations` | List agent conversations |
| `GET` | `/api/v1/wallet/agent/conversations/:id/messages` | Get conversation messages |
| `POST` | `/api/v1/wallet/agent/chat` | Chat with wallet agent (SSE stream response) |

### Health — Habits, Counters, Goals, Weight, Mood

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health/habits` | List habits with today's completion state |
| `POST` | `/api/v1/health/habits` | Create habit (body: name, emoji?, cadence?, weeklyTarget?) |
| `POST` | `/api/v1/health/habits/:id/complete` | Mark habit done (body: date?) |
| `POST` | `/api/v1/health/habits/:id/uncomplete` | Undo a habit completion (body: date?) |
| `POST` | `/api/v1/health/habits/:id/archive` | Archive habit |
| `GET` | `/api/v1/health/habits/:id/completions` | Completion count in a date range (query: from, to) |
| `GET` | `/api/v1/health/counters` | List "days since" counters |
| `POST` | `/api/v1/health/counters` | Create counter (body: name, emoji?, dailyCost?, startedAt?) |
| `POST` | `/api/v1/health/counters/:id/relapse` | Register a relapse (body: date?) |
| `POST` | `/api/v1/health/counters/:id/archive` | Archive counter |
| `GET` | `/api/v1/health/goals` | List goals |
| `POST` | `/api/v1/health/goals` | Create goal (body: title, targetDate, targetWeightKg?, notes?) |
| `POST` | `/api/v1/health/goals/:id/complete` | Mark goal complete |
| `POST` | `/api/v1/health/goals/:id/drop` | Drop goal |
| `POST` | `/api/v1/health/goals/:id/graduate` | Graduate a completed goal into a habit |
| `GET` | `/api/v1/health/mood-check-ins` | List recent mood/energy check-ins (query: days?) |
| `PUT` | `/api/v1/health/mood-check-ins` | Save today's mood/energy check-in (body: mood, energy) |
| `GET` | `/api/v1/health/weight` | Weight trend (query: days?) |
| `PUT` | `/api/v1/health/weight` | Save a weight entry (body: date?, weightKg) |

### Health — Private Medical Records

No agent — medical data is never exposed to LLM tools, by design.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health/medical/records` | List medical records |
| `POST` | `/api/v1/health/medical/records` | Create medical record |
| `PUT` | `/api/v1/health/medical/records/:id` | Update medical record |
| `DELETE` | `/api/v1/health/medical/records/:id` | Delete medical record |
| `POST` | `/api/v1/health/medical/records/:id/attachments` | Upload attachment (multipart, max 10MB) |
| `GET` | `/api/v1/health/medical/records/:id/attachments/:attachmentId/download` | Download attachment |
| `DELETE` | `/api/v1/health/medical/records/:id/attachments/:attachmentId` | Delete attachment |

### Health — Agent

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health/agent/conversations` | List agent conversations |
| `GET` | `/api/v1/health/agent/conversations/:id/messages` | Get conversation messages |
| `POST` | `/api/v1/health/agent/chat` | Chat with health agent (SSE stream response) |

### Projects — Board, Clients, Time Tracking

No agent yet — direction/board layer, no chat surface.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/projects` | List projects |
| `GET` | `/api/v1/projects/:id` | Get single project |
| `POST` | `/api/v1/projects` | Create project |
| `PUT` | `/api/v1/projects/:id` | Update project |
| `POST` | `/api/v1/projects/:id/archive` | Archive project |
| `POST` | `/api/v1/projects/:id/tasks` | Assign a task to the project (body: taskId, boardStatus?) |
| `GET` | `/api/v1/projects/clients` | List clients |
| `POST` | `/api/v1/projects/clients` | Create client |
| `PUT` | `/api/v1/projects/clients/:id` | Update client |
| `POST` | `/api/v1/projects/clients/:id/archive` | Archive client |
| `GET` | `/api/v1/projects/time-entries` | List time entries (filters) |
| `POST` | `/api/v1/projects/time-entries` | Log time entry |
| `PUT` | `/api/v1/projects/time-entries/:id` | Update time entry |
| `DELETE` | `/api/v1/projects/time-entries/:id` | Delete time entry |
| `GET` | `/api/v1/projects/hours-report` | Hours report by client/project/week, with expected income by currency |

### Objectives ("Metas")

No agent — progress is computed read-time by the web presenter over other modules' data.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/objectives` | List objectives |
| `GET` | `/api/v1/objectives/:id` | Get single objective |
| `POST` | `/api/v1/objectives` | Create objective |
| `PUT` | `/api/v1/objectives/:id` | Update objective |
| `POST` | `/api/v1/objectives/:id/achieve` | Mark objective achieved (idempotent) |
| `POST` | `/api/v1/objectives/:id/archive` | Archive objective |

### Inbox ("Bandeja")

No agent chat — the only LLM involvement is the one-shot suggestion below (no tools, no conversation).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/inbox` | List inbox items |
| `GET` | `/api/v1/inbox/:id` | Get single item |
| `POST` | `/api/v1/inbox` | Capture an item (body: text, note?) |
| `POST` | `/api/v1/inbox/:id/triage` | Route to a destination (body: routedTo) — marks triaged, never writes into the target module |
| `POST` | `/api/v1/inbox/:id/discard` | Discard item |
| `POST` | `/api/v1/inbox/:id/suggest` | Classify a likely destination via a one-shot LLM call (idempotent, computed once and cached) |

### Current Auth Surface

Verified auth routes in the active codebase include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/change-password`
- `GET /api/auth/security`
- `POST /api/auth/logout-others`

**Authentication:** protected backend routes use session auth via request auth context. The backend accepts `x-session-token` and the `vdp_session` cookie. The web app uses the cookie-backed same-origin auth flow.
<!-- END:AUTO-GENERATED:API -->

## Testing

```bash
# Unit tests (no external deps)
pnpm --filter @vdp/server test:unit

# Integration tests (requires test Postgres on port 5433)
pnpm --filter @vdp/server db:test:up
pnpm --filter @vdp/server test:integration

# E2E tests (requires test Postgres on port 5433)
pnpm --filter @vdp/server test:e2e

# Local CI baseline
pnpm --filter @vdp/shared build
pnpm typecheck
pnpm lint
pnpm --filter @vdp/web test
pnpm --filter @vdp/server test:unit
pnpm --filter @vdp/server db:test:up
pnpm --filter @vdp/server test:integration
pnpm --filter @vdp/server test:e2e
pnpm --filter @vdp/web exec playwright install chromium
pnpm --filter @vdp/web test:e2e
pnpm --filter @vdp/server db:test:down
```

### Test Architecture

| Type | Stack | What It Tests |
|------|-------|---------------|
| Unit | Vitest + Fake repos (in-memory Map) | Services, domain entities, event subscribers |
| Integration | Vitest + real Postgres (port 5433, tmpfs) | Drizzle repositories, query correctness |
| E2E | Vitest + Fastify `app.inject()` | Full HTTP lifecycle, CRUD, agent chat |

## Infrastructure

There is no dev-infra orchestration (no docker-compose, no Redis, no Jaeger) — the app
processes run directly (`pnpm dev`), and the only external dependency is a single
PostgreSQL instance (see Local Setup above). Distributed tracing (OpenTelemetry/OTLP)
and Langfuse are optional and off by default; see the Observability variables above
if you want to point them at your own collector.

### Database Schema

Active PostgreSQL schemas, one per domain module:
- `core` — users, sessions, audit logs, agent_conversations, agent_messages, file_blobs
- `tasks` — tasks, task_notes, task_embeddings, task_insights, daily_review_state
- `wallet` — accounts, categories, transactions, savings, investments, exchange rates, recurring transactions, wallet_insights
- `health` — habits, habit_logs, counters, counter_attempts, goals, weight_entries, mood_check_ins
- `medical` — private medical records + attachments (no agent, by design)
- `projects` — projects, clients, time_entries
- `objectives` — objectives ("Metas")
- `inbox` — inbox_items ("Bandeja")

Migrations managed by Drizzle Kit in `server/src/migrations/`.

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | This file — setup, commands, env, API reference |
| `AGENTS.md` | Agent, architecture, safety, and verification source of truth |
| `CLAUDE.md` | Thin Claude Code layer over `AGENTS.md` (skills, working agreement, quickstart) |
| `ROADMAP.md` | Forward-looking priorities and gating rules for new domains |
| `docs/architecture/ARCHITECTURE.md` | System shape, layers, data flow, and per-module procedures |
| `server/.env.example` | Server environment template |
| `apps/web/.env.example` | Web environment template |
