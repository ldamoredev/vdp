# AGENTS.md

Repository guidance for Codex when working in `/Users/nicolasbottarini/projects/vdp`.

This file is the source of truth for agents, architecture rules, safety rules, and verification guidance. If another doc drifts from this file, update this file first and then reconcile the other doc.

## Project Shape

VDP is a personal "Life Operating System" monorepo.

```text
apps/web/          Next.js 15 frontend
server/            Fastify 5 backend
packages/shared/   Zod schemas and shared TypeScript types
```

The repo uses pnpm workspaces and Turborepo. The current package manager is pinned in `package.json` as `pnpm@11.5.2`; use Node.js 24.

## Current Runtime Status

Active backend modules are registered in `server/src/modules/DefaultCoreConfiguration.ts`:

- `auth`: first-party users, email/password login, server-managed sessions, audit logs, profile/security routes, request auth context middleware.
- `tasks`: backend, frontend, and agent are stable. Use this as the reference implementation.
- `wallet`: backend, frontend, and agent are active. Frontend coverage is lighter than `tasks`.

Inactive or partial domains:

- `health`: only `server/src/modules/health/schema.ts` plus disabled/demo frontend/API pages exist. It is not registered in `DefaultCoreConfiguration` and is not a real domain yet.
- `people`, `work`, `study`: disabled placeholder/demo frontend pages only.

Do not treat inactive domains as real product surfaces until they pass the full backend/frontend gate in this file.

## Current Sequencing

Follow `ROADMAP.md` for priority. As of the current recovery plan, the next steps are:

1. Restore the local quality baseline for tests, TypeScript, and lint.
2. Fix CI.
3. Bring up the app for owner verification.
4. Fully validate Tasks end to end before real daily use.
5. Harden auth.
6. Only then expand to the next real domain.

Health is still the most coherent next domain candidate, but new domain work should wait until recovery, Tasks validation, and auth hardening gates are complete.

## Commands

```bash
# Dev
pnpm dev
pnpm --filter @vdp/server dev
pnpm --filter @vdp/web dev

# Infrastructure
pnpm infra:start
pnpm infra:stop
pnpm infra:reset

# Database
pnpm db:generate
pnpm db:migrate
pnpm db:fresh
pnpm --filter @vdp/server db:fresh

# Testing
pnpm --filter @vdp/server db:test:up
pnpm --filter @vdp/server db:test:down
pnpm --filter @vdp/server test:unit
pnpm --filter @vdp/server test:integration
pnpm --filter @vdp/server test:e2e
pnpm --filter @vdp/web test
pnpm --filter @vdp/web test:e2e

# Quality
pnpm typecheck
pnpm lint
pnpm --filter @vdp/shared build
```

Run targeted checks before broad checks. Unit tests should use fake repositories and should not require Docker unless the code under test genuinely needs the database.

Backend test conventions:

- Fake repositories live in `{domain}/__tests__/fakes/`, never inside `infrastructure/`.
- Shared DB test infrastructure (`TestDatabase`, the vitest `global-setup`, seeded test users) lives in `server/src/test/`. Module test suites import it from there; do not create per-module copies or re-export shims.

## Backend Architecture

`server/src/modules/Core.ts` owns shared infrastructure:

- `EventBus`
- `AgentRegistry`
- `SSEBroadcaster`
- `RepositoryProvider`
- `ServiceProvider`
- `AuthContextStorage`
- `ModuleContext`
- LLM and OpenTelemetry trace services

`DefaultCoreConfiguration` wires concrete infrastructure: `Database`, the repository registry, logger, agent provider, embedding provider, auth context storage, and active module factories. Register active modules only through `DefaultCoreConfiguration.moduleFactories`.

Repository wiring is per-module: each module binds its repository tokens to Drizzle implementations in `{domain}/infrastructure/db/bindings.ts`, and `modules/DefaultRepositories.ts` composes them into a `RepositoryRegistry`. `modules/common/` must not import from domain modules; only the composition files at `modules/` root (`DefaultCoreConfiguration`, `DefaultRepositories`) enumerate domains.

Each real backend domain follows this module shape:

```text
server/src/modules/{domain}/
├── {Domain}Module.ts
├── {Domain}ModuleRuntime.ts
├── domain/
│   ├── {Entity}.ts
│   └── {Entity}Repository.ts
├── infrastructure/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── bindings.ts
│   │   └── Drizzle{Entity}Repository.ts
│   ├── routes/
│   └── agent/
├── services/
└── __tests__/
```

`{Domain}Module.ts` extends `BaseModule` and exposes controllers, middlewares, descriptors, service registration, event handler registration, and agent registration. `{Domain}ModuleRuntime.ts` wires repositories, services, event handlers, controllers, and agents.

Use one service class per use case. Services should depend on repository interfaces and other services, not direct Drizzle tables. Controllers should be thin HTTP adapters around services.

## Database

The active migration creates these PostgreSQL schemas:

- `core`: users, sessions, audit logs, agent conversations, agent messages.
- `tasks`: tasks, task notes, task embeddings.
- `wallet`: accounts, categories, transactions, savings goals, savings contributions, investments, exchange rates.

`server/src/modules/health/schema.ts` is scaffold code only and is not part of the active migration.

Drizzle schema files live at `{domain}/infrastructure/db/schema.ts` (the core agent tables live at `common/infrastructure/agents/schema.ts`). Do not place schema files at the module root.

Migrations are managed by Drizzle Kit in `server/src/migrations/`. Do not edit committed migrations; generate a new migration unless the user explicitly asks for a disposable local reset. Production data can be discarded only until Tasks starts being used for real personal work. After that, reassess migration and backfill discipline.

## Auth Context Rules

`AuthContextStorage` uses `AsyncLocalStorage` to propagate auth context.

- Always read `userId` from `authContextStorage.getAuthContext()`.
- Never read `userId` from request body, route params, query params, or LLM tool input.
- Protected HTTP controllers should rely on `request.auth` or `authContextStorage`, not caller-supplied identity.
- Agent chat handlers must use `authContextStorage.runWithContext()`, not `enterWith()` or a bare `agent.chat()`.
- Agent tool factories must accept and use `AuthContextStorage`.
- Agent tools must derive `userId` inside the tool execution from `authContextStorage.getAuthContext()`.
- Cross-user isolation tests are required for any route, repository, or agent tool that touches user-owned data.

The old guidance referenced `.codex/reviewers/auth-context-reviewer.md`; that file is not present in this checkout. If it is restored later, use it when touching agent handlers, agent tools, or module runtimes. Until then, manually audit against the rules above before calling auth-sensitive work done.

## Agent Architecture

Domain agents extend `BaseAgent` and declare:

- `domain`
- `systemPrompt`
- `tools`

Agents are registered in each module runtime through `AgentRegistry`. Tasks and Wallet both register agents; Auth does not.

Agent tools are factory functions that close over `ServiceProvider` and `AuthContextStorage`. They should execute use-case services and return serialized results. They must never accept or trust a `userId` from LLM input.

Agent chat HTTP routes use `createAgentChatHandler()` from `server/src/modules/common/http/agent-chat.ts`. The handler streams SSE, persists conversations in the `core` schema, and wraps the chat loop in `authContextStorage.runWithContext(request.auth, ...)`.

Provider selection:

- `AGENT_PROVIDER`: `ollama`, `anthropic`, or `openai-compatible`.
- `OPENAI_COMPAT_API_KEY` implies `openai-compatible` when `AGENT_PROVIDER` is unset.
- `ANTHROPIC_API_KEY` implies `anthropic` when no OpenAI-compatible key is set.
- Otherwise the default is `ollama`.
- `OPENAI_COMPAT_MODEL` sets the OpenAI-compatible provider default model.
- `AGENT_MODEL` overrides the model at `BaseAgent` level.
- Embeddings use `EMBEDDING_PROVIDER=ollama` or a noop provider by default.

Never print or log provider secrets.

## Frontend Architecture

The frontend mirrors the backend module pattern: one folder per domain owns everything for that domain. Top-level layout of `apps/web/src/`:

```text
app/          Routes only. Pages are layout-only: provider plus layout, ideally under 30 lines.
features/     One folder per domain (tasks, wallet, review, home). ALL domain code lives here.
components/   Domain-free app chrome only: primitives/, shell/, chat/, auth/, demo/.
lib/          Domain-free kernel only: api/client.ts + api/types.ts, stores, format, navigation, theme.
```

Do not create per-domain folders under `lib/` or `components/` (no `lib/tasks`, no `components/wallet`). If code is about a domain, it belongs in `features/{domain}/`.

Import direction rules:

- `lib/` imports nothing from `features/` or `components/`.
- `features/{domain}/` may import `lib/`, `components/primitives/`, and other features' public modules: selectors, query keys, plain components. Never another feature's context/provider or internal hooks.
- `components/` (shell, chat, auth) is the cross-domain composition layer: it may import feature public modules (for example the chat shell uses `features/tasks/chat-sync`).
- `app/` may import anything.

Frontend domains use the feature module pattern under `apps/web/src/features/{domain}/` (flat — no `presentation/` layer; the whole web feature is presentation):

- `{domain}-api.ts`: HTTP client functions for the domain routes, built on `lib/api/client.ts`.
- `{domain}-selectors.ts`: pure functions, no React imports, primary unit-test surface.
- `{domain}-query-keys.ts`: React Query key factory.
- `use-{domain}-queries.ts`: reads and derived state.
- `use-{domain}-mutations.ts`: writes and busy state.
- `{domain}-context.tsx`: two contexts, reads and actions.
- `use-{domain}-context.ts`: consumer hooks.
- `components/`: components consume context directly. Pages pass no domain data props.

API response types for active domains live in `packages/shared/src/types/` and are re-exported through `apps/web/src/lib/api/types.ts`. Do not redefine server response shapes in web code. Agent tool names live in `packages/shared/src/constants/agent-tools.ts`; server tool definitions and web tool handling both type against that registry.

The frontend never calls the Fastify backend directly from client code. Client API calls go through `apps/web/src/app/api/proxy/v1/[...path]/route.ts`, which forwards to `NEXT_PUBLIC_API_URL`, attaches the `vdp_session` httpOnly cookie as `x-session-token`, and filters hop-by-hop headers.

Same-origin auth routes live under `apps/web/src/app/api/auth/*` and manage the `vdp_session` cookie. Backend auth routes live under `/api/auth/*`.

## Frontend UI Rules

- Stack: Next.js 15, React 19, TailwindCSS v4, React Query v5, `lucide-react`.
- Do not add Shadcn/Radix component libraries.
- Use existing primitives and feature patterns before adding new abstractions.
- Keep operational/product screens dense, calm, and usable; do not turn app surfaces into marketing pages.
- Use lucide icons for tool buttons when an icon exists.
- Make pages and controls responsive; text must not overflow or overlap.

## Cross-Domain Behavior

The first live cross-domain signal is Wallet emitting `wallet.spending.spike`, which Tasks handles through `CrossDomainEventHandlers` by creating a high-priority review task and insight.

Future cross-domain signals should follow the same pattern:

- Emit a domain event from the source module.
- Subscribe in the target module via `eventBus`.
- Run actions through services, never direct DB writes.
- Tests must cover the happy path and error resilience. Event bus subscribers must not block unrelated work.

## New Domain Gate

A domain is only real when it matches the Tasks template:

1. Module registered in `DefaultCoreConfiguration`.
2. Drizzle schema and migration applied.
3. Domain entity with immutable `fromSnapshot()` / `toSnapshot()`.
4. Repository interface, Drizzle implementation, and fake repository.
5. Use-case services, one class per operation.
6. HTTP controller using auth context for `userId`.
7. Cross-user isolation tests.
8. Frontend feature module following the two-context pattern.
9. Shared Zod schemas and cross-package types in `@vdp/shared`.
10. Pages registered in `apps/web/src/lib/navigation.ts`.
11. Agent registered only after tools follow the auth-context rules.

## Conventions

- Dates: use `getTodayISO()` or `localDateISO()` from `@/lib/format`; never `new Date().toISOString().slice(0, 10)`.
- Entities: immutable snapshots with `fromSnapshot()` and `toSnapshot()`.
- Selectors: copy arrays before sorting.
- API contracts: put cross-package types and Zod schemas in `@vdp/shared`.
- Repositories: unit tests use fake repositories; integration tests use real Postgres.
- Formatting: preserve the repo's existing TypeScript style in touched files.
- Scope: prefer the repo's existing patterns over new abstractions.

## Safety

- Do not read, edit, stage, or print `.env`, `.env.*`, `.key`, `.pem`, or `.secret` files.
- `.claude/dev-credentials.env` exists for local manual verification but must remain private.
- Do not run destructive git commands or force pushes.
- Do not edit committed migrations; generate a new migration.
- Do not stage or commit unless the user explicitly asks.
- If the working tree is dirty, preserve unrelated user changes.

## Verification

Before claiming completion, run the smallest meaningful verification:

- Documentation-only change: no automated tests required; inspect the diff and search for stale references.
- Frontend-only change: `pnpm typecheck:web` plus targeted frontend tests if behavior changed.
- Server unit behavior: `pnpm --filter @vdp/server test:unit`.
- Server DB behavior: start the test DB with `pnpm --filter @vdp/server db:test:up`, then run `pnpm --filter @vdp/server test:integration`.
- Server E2E behavior: test DB required, then `pnpm --filter @vdp/server test:e2e`.
- Web E2E behavior: backend and frontend must be running as required by Playwright config, then `pnpm --filter @vdp/web test:e2e`.
- Cross-module or broad changes: relevant typechecks plus targeted tests, then broaden only as risk warrants.

If a verification command cannot be run, say exactly why and what remains unverified.
