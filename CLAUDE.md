# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
pnpm dev                                    # Start all services (Turbo)
pnpm --filter @vdp/server dev               # Backend only (port 4000, tsx watch)
pnpm --filter @vdp/web dev                  # Frontend only (port 3000)

# Infrastructure
pnpm infra:start                            # Start Postgres + Redis + Jaeger (Docker)
pnpm infra:stop

# Database
pnpm db:generate                            # Generate Drizzle migration
pnpm db:migrate                             # Apply migrations
pnpm --filter @vdp/server db:fresh          # Reset DB + migrate (dev)

# Testing
pnpm --filter @vdp/server db:test:up        # Start test DB (port 5433, tmpfs)
pnpm --filter @vdp/server test:unit         # Unit tests (domain + services, no DB)
pnpm --filter @vdp/server test:integration  # Integration tests (requires test DB)
pnpm --filter @vdp/web test                 # Frontend tests (vitest)

# Run a single test file
pnpm --filter @vdp/server exec vitest run src/modules/tasks/__tests__/services/CreateTask.test.ts

# Typecheck
pnpm exec tsc --noEmit -p apps/web/tsconfig.json
pnpm exec tsc --noEmit -p server/tsconfig.json
```

## Architecture

### Monorepo layout
```
apps/web/       Next.js 15 frontend
server/         Fastify 5 backend
packages/shared/ Zod schemas + shared TypeScript types
```

### Backend: Domain Module system

Each domain (`tasks`, `wallet`, `auth`) is a self-contained module:

```
server/src/modules/{domain}/
├── {Domain}Module.ts            # Extends BaseModule, declares controllers/middlewares
├── {Domain}ModuleRuntime.ts     # Wires deps: creates repos, services, controllers, agents
├── domain/
│   ├── {Entity}.ts              # Immutable entity class: fromSnapshot() / toSnapshot()
│   └── {Entity}Repository.ts   # Repository interface
├── infrastructure/
│   ├── db/
│   │   ├── schema.ts            # Drizzle table definitions
│   │   └── Drizzle{Entity}Repository.ts
│   ├── routes/
│   │   ├── {Domain}Controller.ts       # REST routes
│   │   └── {Domain}AgentController.ts  # Agent chat route (SSE)
│   └── agent/                   # Agent + tool definitions
├── services/                    # One class per use case (Get*, Create*, ...)
└── __tests__/
    ├── domain/
    ├── services/
    ├── integration/
    └── fakes/
        └── Fake{Entity}Repository.ts   # In-memory, used in unit tests
```

**`Core`** (`server/src/modules/Core.ts`) holds all shared infrastructure: `EventBus`, `AgentRegistry`, `SSEBroadcaster`, `RepositoryProvider`, `AuthContextStorage`, and `ModuleContext`. `DefaultCoreConfiguration` instantiates and wires the concrete implementations; `App.ts` wraps Fastify.

Modules are registered by adding a factory to `DefaultCoreConfiguration.moduleFactories`:
```typescript
(context) => new {Domain}Module(context)
```

### Auth context

`AuthContextStorage` uses `AsyncLocalStorage` to propagate `userId` across the full async call stack without passing it as a parameter. `SessionTokenAuthenticationMiddleware` calls `setAuthContext()` early in the request lifecycle. Agent chat handlers must use `runWithContext()` (not `enterWith()`) to ensure the context survives across the streaming loop. **Always read `userId` from `authContextStorage.getAuthContext()`** — never from request body/params.

### Agent pattern

Domain agents extend `BaseAgent` and declare `domain`, `systemPrompt`, and `tools`. Agent tools are factory functions that close over `ServiceProvider` and `AuthContextStorage`. The chat route streams SSE via `createAgentChatHandler()`, which calls `agent.chat()` wrapped in `runWithContext()`. Agents are resolved from `AgentRegistry` by domain name.

### Frontend: Feature module system

Each domain module follows the same structure under `apps/web/src/features/{domain}/presentation/`:

- **`{domain}-selectors.ts`** — pure functions (no React, primary unit test surface)
- **`{domain}-query-keys.ts`** — React Query key factory
- **`use-{domain}-queries.ts`** — `useQuery` hooks + derived state
- **`use-{domain}-mutations.ts`** — `useMutation` wrappers + per-item busy tracking
- **`{domain}-context.tsx`** — two contexts: `{Domain}QueriesContext` (reads) + `{Domain}ActionsContext` (writes); both composed in a single `{Domain}Provider`
- **`use-{domain}-context.ts`** — `use{Domain}Data()` + `use{Domain}Actions()` consumer hooks
- **`components/`** — components pull data via context, receive no props from the page

Pages are layout-only: `{Domain}Provider` + grid, under 30 lines.

Reference implementation: `apps/web/src/features/tasks/presentation/`. Scaffold doc: `apps/web/src/features/MODULE_SCAFFOLD.md`.

### Frontend–backend connection

The frontend never calls the backend directly. All API calls go through the Next.js proxy route `app/api/proxy/v1/[...path]/route.ts`, which forwards requests to `NEXT_PUBLIC_API_URL` (the Fastify server) and attaches the `vdp_session` httpOnly cookie as an `X-Session-Token` header. The client-side API layer lives in `apps/web/src/lib/api/` — `client.ts` exports `request<T>()` and `chatStream()`.

### Key conventions

- **Dates**: always use `getTodayISO()` or `localDateISO()` from `@/lib/format` — never `new Date().toISOString().slice(0,10)` (timezone bug).
- **Immutability**: entity mutations return new snapshots via `fromSnapshot()`; selectors spread arrays before sorting.
- **Testing**: unit tests use `Fake*Repository` (in-memory, no Docker). Integration tests use the test DB on port 5433 (started with `db:test:up`). Vitest projects: `unit` | `integration` | `e2e`.
- **LLM provider**: controlled by `AGENT_PROVIDER` env var (`anthropic` | `openai-compatible` | `ollama`). In production, Groq is used via `openai-compatible`. Model is overridden by `AGENT_MODEL`.

## Environment variables (server)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Primary Postgres |
| `TEST_DATABASE_URL` | Test Postgres (port 5433) |
| `ACCESS_SECRET` | Session token signing |
| `AGENT_PROVIDER` | `anthropic` / `openai-compatible` / `ollama` |
| `AGENT_MODEL` | Override LLM model |
| `OPENAI_COMPAT_BASE_URL` / `OPENAI_COMPAT_API_KEY` | Groq or any OpenAI-compatible API |
| `ANTHROPIC_API_KEY` | Anthropic direct |

Dev credentials for local verification are in `.claude/dev-credentials.env` (gitignored).

## Active domains

`tasks` and `wallet` are fully implemented (backend + frontend). `health`, `people`, `work`, and `study` exist as frontend demo/placeholder pages only — no backend modules yet.
