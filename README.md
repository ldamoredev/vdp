# VDP — Vida Digital Personal

A modular personal AI operating system.

Current active scope in the repository:

- `Tasks`
- `Wallet`

The long-term product vision still includes `Health`, `People`, `Work`, and `Study`, but those domains are not currently verified as active backend modules.

## Production

| Service | URL | Provider |
|---------|-----|----------|
| Backend | https://vdp-qr8o.onrender.com | Render (Docker, free tier) |
| Frontend | https://vdp-web.vercel.app | Vercel |
| Database | PostgreSQL + pgvector | Supabase (free tier) |
| LLM | Groq (OpenAI-compatible) | Free tier |

Authentication now uses first-party users with email/password plus server-managed sessions.

The web app authenticates through same-origin auth routes and an `httpOnly` `vdp_session` cookie.

## Workspace

```
vdp/
├── apps/web/          # Next.js 15 frontend
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
| `pnpm infra:start` | Start local Postgres + Redis + Jaeger |
| `pnpm infra:stop` | Stop local infrastructure |
| `pnpm infra:reset` | Reset infrastructure (destroy volumes + restart) |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm clean` | Remove all node_modules, dist, .next, .turbo |

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

- Node.js 22+
- pnpm 10.6.5+ (`corepack enable && corepack prepare pnpm@10.6.5 --activate`)
- Docker (for Postgres)

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start local infrastructure (Postgres + Redis + Jaeger)
pnpm infra:start

# 3. Copy env files
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Set DATABASE_URL in server/.env
# DATABASE_URL=postgresql://vdp:vdp@localhost:5432/vdp

# 5. Run migrations
pnpm db:migrate

# 6. Start dev servers
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Jaeger UI: http://localhost:16686

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

### Web (`apps/web/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | — | Backend API base URL (e.g., `http://localhost:4000/api/v1`) |
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

# All tests
pnpm --filter @vdp/server test:run
```

### Test Architecture

| Type | Stack | What It Tests |
|------|-------|---------------|
| Unit | Vitest + Fake repos (in-memory Map) | Services, domain entities, event subscribers |
| Integration | Vitest + real Postgres (port 5433, tmpfs) | Drizzle repositories, query correctness |
| E2E | Vitest + Fastify `app.inject()` | Full HTTP lifecycle, CRUD, agent chat |

## Infrastructure

### Local Docker Services

```bash
pnpm infra:start   # Starts all services
pnpm infra:stop    # Stops all services
pnpm infra:reset   # Destroys volumes + restarts
```

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Postgres | `pgvector/pgvector:pg16` | 5432 | Main database with vector support |
| Redis | `redis:7` | 6379 | Cache (future use) |
| Jaeger | `jaegertracing/all-in-one` | 16686 (UI), 4318 (OTLP) | Distributed tracing |

### Database Schema

Two PostgreSQL schemas:
- `tasks` — tasks, task_notes, task_embeddings tables
- `core` — agent_conversations, agent_messages tables

Migrations managed by Drizzle Kit in `server/src/migrations/`.

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | This file — setup, commands, API reference |
| `ARCHITECTURE.md` | Module architecture, patterns, new domain checklist |
| `PRODUCT.md` / `PRODUCT_es.md` | Product specification |
| `PLAN.md` | Implementation plan |
| `CODE_AUDIT.md` | Code health audit report |
| `PRODUCT_REVIEW.md` | Product review and 30-day roadmap |
| `database-review.md` | Database schema, query, and connection review |
| `DEPLOY_REVIEW.md` | Production readiness review |
| `server/.env.example` | Server environment template |
| `apps/web/.env.example` | Web environment template |
