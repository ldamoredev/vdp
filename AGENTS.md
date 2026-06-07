# AGENTS.md

Repository guidance for Codex when working in `/Users/lautarodamore/Documents/vdp`.

## Project Shape

VDP is a personal "Life Operating System" monorepo.

```text
apps/web/          Next.js 15 frontend
server/            Fastify 5 backend
packages/shared/   Zod schemas and shared TypeScript types
```

Active domains:

- `tasks`: backend, frontend, and agent are stable. Use this as the reference implementation.
- `wallet`: backend, frontend, and agent are active. Frontend coverage is lighter than `tasks`.
- `health`, `people`, `work`, `study`: frontend demo or placeholder pages only. Do not treat them as real domains until the full backend/frontend gate is met.

The roadmap says the default sequencing is: harden auth first, then add the next real domain. Health is the most coherent next candidate, but new domain work should wait until production auth flow validation is complete.

## Commands

```bash
# Dev
pnpm dev
pnpm --filter @vdp/server dev
pnpm --filter @vdp/web dev

# Infrastructure
pnpm infra:start
pnpm infra:stop

# Database
pnpm db:generate
pnpm db:migrate
pnpm --filter @vdp/server db:fresh

# Testing
pnpm --filter @vdp/server db:test:up
pnpm --filter @vdp/server test:unit
pnpm --filter @vdp/server test:integration
pnpm --filter @vdp/web test

# Typecheck
pnpm exec tsc --noEmit -p apps/web/tsconfig.json
pnpm exec tsc --noEmit -p server/tsconfig.json
```

Run targeted checks before broad checks. Unit tests should use fake repositories and should not require Docker unless the code under test genuinely needs the database.

## Backend Architecture

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
│   │   └── Drizzle{Entity}Repository.ts
│   ├── routes/
│   └── agent/
├── services/
└── __tests__/
```

`Core` owns shared infrastructure: `EventBus`, `AgentRegistry`, `SSEBroadcaster`, `RepositoryProvider`, `AuthContextStorage`, and `ModuleContext`. `DefaultCoreConfiguration` wires concrete implementations. Register modules through `DefaultCoreConfiguration.moduleFactories`.

## Auth Context Rules

`AuthContextStorage` uses `AsyncLocalStorage` to propagate `userId`.

- Always read `userId` from `authContextStorage.getAuthContext()`.
- Never read `userId` from request body, route params, query params, or LLM tool input.
- Agent chat handlers must use `runWithContext()`, not `enterWith()` or a bare `agent.chat()`.
- Agent tool factories must accept and use `AuthContextStorage`.

If you touch agent handlers, agent tools, or module runtimes that wire them, review with `.codex/reviewers/auth-context-reviewer.md` before calling the work done.

## Frontend Architecture

Frontend domains use the feature module pattern under `apps/web/src/features/{domain}/presentation/`:

- `{domain}-selectors.ts`: pure functions, no React imports, primary unit-test surface.
- `{domain}-query-keys.ts`: React Query key factory.
- `use-{domain}-queries.ts`: reads and derived state.
- `use-{domain}-mutations.ts`: writes and busy state.
- `{domain}-context.tsx`: two contexts, reads and actions.
- `use-{domain}-context.ts`: consumer hooks.
- `components/`: components consume context directly. Pages pass no domain data props.

Pages under `apps/web/src/app/(domain)/{domain}/page.tsx` should be layout-only: provider plus layout, ideally under 30 lines.

## Conventions

- Dates: use `getTodayISO()` or `localDateISO()` from `@/lib/format`; never `new Date().toISOString().slice(0, 10)`.
- Entities: immutable snapshots with `fromSnapshot()` and `toSnapshot()`.
- Selectors: copy arrays before sorting.
- API: frontend calls the backend only through `apps/web/src/app/api/proxy/v1/[...path]/route.ts`.
- Shared contracts: put cross-package types and Zod schemas in `@vdp/shared`.
- UI: Next.js 15, React 19, TailwindCSS v4, React Query v5, `lucide-react`; no Shadcn/Radix component library.

## Safety

- Do not read, edit, stage, or print `.env`, `.env.*`, `.key`, `.pem`, or `.secret` files.
- `.claude/dev-credentials.env` exists for local manual verification but should remain private.
- Do not run destructive git commands or force pushes.
- Do not edit committed migrations; generate a new migration.
- Production data can currently be discarded, so avoid over-engineering backward-compatible migrations until that constraint changes.

## Verification

Before claiming completion, run the smallest meaningful verification:

- Frontend-only change: `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` plus targeted frontend tests if behavior changed.
- Server unit behavior: `pnpm --filter @vdp/server test:unit`.
- Server DB behavior: start the test DB, then `pnpm --filter @vdp/server test:integration`.
- Cross-module or broad changes: relevant typechecks plus targeted tests, then broader suite if risk warrants it.

