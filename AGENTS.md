# AGENTS.md

Repository guidance for Codex when working in `/Users/nicolasbottarini/projects/vdp`.

This file is the source of truth for agents, architecture rules, safety rules, and verification guidance. If another doc drifts from this file, update this file first and then reconcile the other doc.

## Project Shape

VDP is a personal "Life Operating System" monorepo.

```text
apps/web/          Vite SPA frontend (React 19 + react-router 7)
server/            Fastify 5 backend (also serves the SPA build in production)
packages/shared/   Zod schemas and shared TypeScript types
```

The repo uses pnpm workspaces and Turborepo. The current package manager is pinned in `package.json` as `pnpm@11.5.2`; use Node.js 24.

## Current Runtime Status

Active backend modules are registered in `server/src/modules/DefaultCoreConfiguration.ts`:

- `auth`: first-party users, email/password login, failed-login rate limiting, server-managed sessions, audit logs, profile/security routes, request auth context middleware.
- `tasks`: backend, frontend, and agent are stable. Use this as the reference implementation.
- `wallet`: backend, frontend, and agent are active. Frontend coverage is lighter than `tasks`.
- `health`: active — habits with daily or x-times-per-week cadence (per-day completion, daily/weekly streaks, archive), "days since" abstinence counters, goals with optional target weight, body-weight trend tracking, daily mood/energy check-ins inside the review ritual, and the private medical archive section with structured records plus file attachments through `FileStorage`. Backend and frontend for weight; backend, frontend, and agent for health habits/counters/goals; no medical agent by design, because medical data must not be exposed to LLM tools without an explicit owner decision.

Inactive domains:

- `people`, `work`, `study`: disabled placeholder frontend pages only.

Do not treat inactive domains as real product surfaces until they pass the full backend/frontend gate in this file.

## Current Sequencing

Follow `ROADMAP.md` for priority. Phases 0–3 are complete (recovery, Tasks production-readiness, auth hardening code-side, Health habits slice). Phase 4 shipped H1 counters, H2 goals, H3 medical records, P1 flexible habit cadence, P2 daily mood/energy check-ins, and P3 weight tracking. The Architecture Track is complete: A1 Vite port, A2 Health pilot, A3/A4 skills, A5 frontend migration, and A6 CQBus on the api — every active domain exposes HTTP through CQBus, and the legacy `ServiceProvider` bridge plus its dead `registerServices` lifecycle hook are deleted from the common core. One feature per work session.

Owner-pending items (do not attempt from a local session):

- Re-deploy production as a single Railway service: the server Dockerfile now builds and serves the SPA (A1 port); the separate Vercel deployment is retired. Then run the production smoke of the auth/session flow (closes Phase 2 formally).
- Production has NOT yet run migrations `0001`–`0005`; they must be applied on the next deploy before the new features work there.

## Skills

The repo ships seven reusable workflows as `SKILL.md` files. They apply to **any** agent working here, not just Claude Code. Each is a self-contained markdown doc (procedure + hard rules + verification) that references this file and the architecture docs rather than restating rules.

- Location: `.claude/skills/{name}/SKILL.md`, mirrored at `.agents/skills/` (a symlink to the same files, so agents that look under `.agents/` find them; one source of truth, no drift). Local `.claude/` config (settings, launch) stays gitignored; only the skills are tracked.
- **Codex and other non-Claude agents:** these are plain markdown — you will not auto-trigger them, so read the relevant `SKILL.md` and follow it when the task matches. Treat `code-review` and `tdd-workflow` as always-on guards.

The skills:

- `code-review` and `tdd-workflow` are **process guards** — apply them automatically (review the diff before any commit/push; drive changes test-first). `code-review` findings are warnings that block the commit/push until reported to the owner.
- `create-service-api`, `create-service-web`, `create-presenter-web`, `create-aggregate`, `create-agent-tool` are **generators** — follow the matching one when scaffolding that kind of unit. They carry the exact file lists and hard rules.

## Working Agreement (how sessions run)

- Work directly on `main`. Never create branches or PRs unless the owner asks.
- One ROADMAP feature per session, in the Phase 4 order. Ship it complete through the per-feature gate (backend + shared contracts + frontend + tests + migration + docs), verify, then STOP and summarize for the owner.
- Do not commit until the owner explicitly says so. When they do: split into logical commits (backend / frontend / docs), imperative messages explaining the why, then push to `main`.
- After shipping a feature, mark it in `ROADMAP.md` (SHIPPED + strikethrough in the order line) and reconcile this file if runtime status changed.
- Local verification before claiming done, then a manual browser smoke against the real app. Clean up any smoke data you created in the dev DB afterwards.
- Dev infrastructure quirks: `pnpm infra:start` fails because port 5432 is taken; the real dev Postgres is the `vdp-postgres-dev` container on port 55432 (`docker start vdp-postgres-dev`), credentials `vdp:vdp`, database `vdp`. Run migrations with `DATABASE_URL='postgresql://vdp:vdp@localhost:55432/vdp' pnpm db:migrate` from `server/`.

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
- `TestDatabase.SETUP_SQL` is a handwritten schema snapshot, separate from the Drizzle migrations: every new table must be added there AND to the `truncate()` list (see Database section).
- `truncate()` retries on Postgres deadlock (40P01): the app's fire-and-forget writes (insight persistence) can race the TRUNCATE between tests. Keep that retry.
- E2E suites boot a per-module `TestApp` + `TestCoreConfiguration` (auth faked via the `x-test-user-id` header). When a feature's cross-domain flow matters, boot both modules together — see `health/__tests__/e2e/TestCoreConfiguration.ts` which loads Health + Tasks.
- The login rate limiter is in-process and does NOT reset between e2e tests; tests that trip it must use a dedicated email.
- Unit tests pin time with `vi.useFakeTimers()` + `vi.setSystemTime(...)`; e2e uses the real clock and relative date helpers (`daysAgo(n)`).

## Backend Architecture

`server/src/modules/Core.ts` owns shared infrastructure:

- `CQBus`
- `EventBus`
- `AgentRegistry`
- `SSEBroadcaster`
- `RepositoryProvider`
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
├── app/
│   └── {UseCase}{Command|Query}.ts
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

`{Domain}Module.ts` extends `BaseModule` and exposes controllers, middlewares, descriptors, CQBus handler registration, event handler registration, and agent registration. `{Domain}ModuleRuntime.ts` wires repositories, CQBus handlers, reusable services, event handlers, controllers, and agents.

New HTTP-exposed backend use cases are CQBus-first: create one `Command<T>` or `Query<T>` plus `RequestHandler` under `app/`, register it in `{Domain}ModuleRuntime.registerHandlers()`, and have controllers call `bus.execute(..., executionContextFromAuth(request.auth))`. Handlers call `requireUserIdentity(identity)` before touching user-owned data. `Command`/`Query` objects carry operation data only — never `userId`.

`services/` may still hold reusable domain/application collaborators (auth orchestration, embedding, duplicate detection, event/insight stores, stats engines, cross-domain orchestration) that CQBus handlers compose. Services should depend on repository interfaces and other services, not direct Drizzle tables. Controllers stay thin HTTP adapters around the bus.

Domain modeling: two styles coexist deliberately, and both are valid.

- Rich entity class with behavior (`tasks/domain/Task.ts`: `complete()`, `carryOver()`, `isStuck()`). Default for new domains whose entities have state transitions or invariants of their own.
- Plain `readonly` types with orchestration in CQBus handlers or reusable services (`wallet/domain/*`, `auth/domain/*`). Appropriate when the domain is mostly coordination across repositories (transfers, stats, contributions).

Do not rewrite a module from one style to the other without an explicit reason; consistency-for-its-own-sake is not one.

## Database

The active migrations create these PostgreSQL schemas:

- `core`: users, sessions, audit logs, agent conversations, agent messages.
- `tasks`: tasks, task notes, task embeddings, task insights.
- `wallet`: accounts, categories, transactions, savings goals, savings contributions, investments, exchange rates, wallet insights.
- `health`: habits, habit logs, counters, counter attempts, goals, mood check-ins, weight entries.
- `medical`: records and attachments. This is a database namespace owned by the Health medical section, not a standalone backend module.

Money amounts are per-currency (ARS and USD coexist). NEVER sum amounts across currencies — `DetectSpendingSpike` groups by currency for exactly this reason. New money aggregations must filter or group by currency.

Adding a table requires THREE synchronized changes: (1) the Drizzle schema at `{domain}/infrastructure/db/schema.ts` plus `pnpm db:generate`, (2) the handwritten `SETUP_SQL` snapshot in `server/src/test/test-database.ts`, and (3) the `TRUNCATE` list in the same file. Tests will pass while production breaks (or vice versa) if these drift.

Drizzle schema files live at `{domain}/infrastructure/db/schema.ts` (the core agent tables live at `common/infrastructure/agents/schema.ts`). Do not place schema files at the module root.

Migrations are managed by Drizzle Kit in `server/src/migrations/`. Do not edit committed migrations; generate a new migration unless the user explicitly asks for a disposable local reset. Production data can be discarded only until Tasks starts being used for real personal work. After that, reassess migration and backfill discipline.

## Auth Context Rules

`AuthContextStorage` uses `AsyncLocalStorage` to propagate auth context.

- Always read `userId` from `authContextStorage.getAuthContext()`, `request.auth`, or CQBus `Identity` derived from those auth contexts.
- Never read `userId` from request body, route params, query params, or LLM tool input.
- Protected HTTP controllers should rely on `request.auth` or `authContextStorage`, not caller-supplied identity. CQBus controllers pass `executionContextFromAuth(request.auth)`; handlers call `requireUserIdentity(identity)`.
- Agent chat handlers must use `authContextStorage.runWithContext()`, not `enterWith()` or a bare `agent.chat()`.
- Agent tool factories must accept and use `AuthContextStorage`.
- Agent tools must build CQBus execution context inside the tool execution from `authContextStorage.getAuthContext()`.
- Cross-user isolation tests are required for any route, repository, or agent tool that touches user-owned data.

The old guidance referenced `.codex/reviewers/auth-context-reviewer.md`; that file is not present in this checkout. If it is restored later, use it when touching agent handlers, agent tools, or module runtimes. Until then, manually audit against the rules above before calling auth-sensitive work done.

## Agent Architecture

Domain agents extend `BaseAgent` and declare:

- `domain`
- `systemPrompt`
- `tools`

Agents are registered in each module runtime through `AgentRegistry`. Tasks and Wallet both register agents; Auth does not.

Agent tools are factory functions that close over `CQBus` and `AuthContextStorage`. They should execute the same commands/queries as HTTP and return serialized results. Tools must never accept or trust a `userId` from LLM input.

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

Hard agent rules learned in production:

- System prompts MUST be builder functions evaluated per chat (`buildTasksSystemPrompt()` + a `get systemPrompt()` getter). Never a module-level const: template literals interpolate `todayISO()` at import time and the agent's "today" freezes at boot.
- Tool names are typed against the registry in `packages/shared/src/constants/agent-tools.ts`. Adding a tool means adding it there first; server definitions and web tool handling both typecheck against it.
- Tools must validate LLM-provided date strings with `localDateStringSchema` before dispatching commands/queries (tools bypass the HTTP Zod layer).
- The agent must never see a `userId` — always derive CQBus execution context inside the tool from `authContextStorage.getAuthContext()`.

## Insights And Time-Based Signals

There is NO scheduler/cron in the stack. Time-based signals use two patterns:

1. **Write-time detection** for signals triggered by a user action: e.g. `CompleteHabitDay` computes streak breaks and milestones when a habit is completed, and only for `date === today` (backfills stay silent). See `tasks` events and `health/services/CompleteHabitDay.ts`.
2. **Lazy detection on overview load** for signals that need time to pass with no interaction: e.g. counter milestones in `health/services/GetCountersOverview.ts`. The dedupe state is a persisted column (`last_milestone_notified`) updated and saved BEFORE emitting the event — a failed emit may cost one insight but can never duplicate. After long gaps, emit only the highest crossed milestone, not every intermediate one. H2 goal deadlines must follow this same pattern.

Insight stores (`TaskInsightsStore`, `WalletInsightsStore`) are in-memory read models backed by Postgres: writes persist fire-and-forget through `TaskInsightRepository`/`WalletInsightRepository`, and `hydrate()` reloads state at boot via the module `start()` hook. Inside `addInsight`, listeners run BEFORE persisting so the SSE live-read marking lands in the insert. Keep that order.

## Frontend Architecture

The frontend is a Vite SPA (no SSR) that mirrors the backend module pattern with **presenters + a command/query bus (CQBus) + a `core/` composition root**. Full detail and the 5-step procedure for adding a module live in [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) §4 — the canonical reference. Top-level layout of `apps/web/src/`:

```text
main.tsx          Entry: mounts <WebApp/> under React StrictMode.
WebApp.tsx        ThemeProvider + CoreProvider + (TasksEventsProvider) + Providers + RouterProvider.
routes.tsx        Whole route tree (createBrowserRouter); each route renders a screen from ui/screens/*.
createAppCore.ts  App composition root: new Core().use(HealthModule).use(TasksModule).use(WalletModule).
core/             NO React under here (grep/lint enforced): domain/{m}, app/{m} (Command/Query+handlers
                  + {M}Module), infrastructure/http (Http{M}Gateway + FetchHttpClient).
ui/               All React: primitives/ (design-system leaves), shell/ (chrome + auth-gate),
                  chat/ (agent chat shell), events/ ({M}Events channels), models/{m} (ViewModels),
                  screens/{m} ({M}Presenter + use{M}Presenter + {M}Screen + co-located components/).
lib/              Framework-agnostic kernel: api/client + api/types, format, navigation, theme, providers.
```

There is **no `pages/`, `components/`, or `features/` layer** — that earlier split was collapsed into `ui/` during the architecture migration. Route screens live in `ui/screens/{module}/` and `routes.tsx` imports them directly. Component placement is ownership-based: **one-module → `ui/screens/{module}/components/`; shared leaf → `ui/primitives/`; app chrome → `ui/shell/`.** The domain shell (`ui/shell/domain-layout.tsx`) renders an `<Outlet/>` behind `AuthGate`; route errors render `ui/shell/domain-error.tsx` / `root-error.tsx` via router `errorElement`.

Import direction rules:

- `core/` imports nothing from `ui/` and no React (enforced); it depends only on `@vdp/shared`, `lib/`, and the `@nbottarini` libraries.
- `lib/` imports nothing from `core/` or `ui/`.
- `ui/` may import `core/` (via `useCore()`/the bus), `lib/`, and `@vdp/shared`. A screen owns its own presenter/VM; cross-section coordination goes through `ui/events`, never by reaching into another screen's internals.
- `routes.tsx` and entrypoints may import anything.

Migration status: **health, tasks, wallet** are fully on this pattern (no React Query). **home, review, login, landing, settings** are legacy (React Query / plain components) relocated under `ui/screens/*` as-is; **people, study, work** have a presenter returning mock data. React Query (`QueryClientProvider` in `lib/providers.tsx`) stays only for the not-yet-migrated modules.

API response types for active domains live in `packages/shared/src/types/` and are re-exported through `apps/web/src/lib/api/types.ts`. Do not redefine server response shapes in web code. Agent tool names live in `packages/shared/src/constants/agent-tools.ts`; server tool definitions and web tool handling both type against that registry.

The SPA talks to the API **same-origin** — there is no BFF or proxy layer. `lib/api/client.ts` calls `/api/v1/...` with relative paths. In dev, the Vite server proxies `/api` to the Fastify backend (`VITE_API_PROXY_TARGET`, default `http://localhost:4000`). In production, Fastify serves the SPA build itself (`server/src/App.ts` `registerSpaStatic`; dist path via `WEB_DIST_PATH` or `../apps/web/dist`), so same-origin holds without configuration.

Auth is cookie-native on the backend: `/api/auth/login` and `/api/auth/register` set the `vdp_session` httpOnly cookie (see `auth/infrastructure/http/session-cookie.ts`), logout and change-password clear it, and `SessionTokenAuthenticationMiddleware` accepts the cookie or the `x-session-token` header. Invalid browser cookies are cleared on 401. Non-`/api` paths are public at the middleware level (they are SPA assets/routes); client-side redirect to `/login` is `AuthGate`'s job. The global API rate limit is configurable via `RATE_LIMIT_MAX` (default 300/min per IP; e2e uses a high value).

## Frontend UI Rules

- Stack: Vite, React 19, react-router 7, TailwindCSS v4, React Query v5, `lucide-react`.
- Do not add Shadcn/Radix component libraries.
- Use existing primitives and feature patterns before adding new abstractions.
- Keep operational/product screens dense, calm, and usable; do not turn app surfaces into marketing pages.
- Use lucide icons for tool buttons when an icon exists.
- Make pages and controls responsive; text must not overflow or overlap.

Visual identity ("tinta iris" — June 2026 design pass, all tokens in `apps/web/src/globals.css`):

- Palette: violet-cast ink `#07040D` (dark) / violet porcelain `#FAF8FC` (light); default accent electric iris `#7C6AF5`; per-domain accents via `.domain-{key}` overrides. Do NOT reintroduce the old slate/Tailwind-blue look.
- Three type roles: Bricolage Grotesque for display (`h1`, `h2`, `.font-display`), Inter for body/UI, JetBrains Mono for data via `.font-data`.
- Signature rule: every key metric (money, percentages, counters, day counts) wears `.font-data`. The body has global `tabular-nums`. New metric UI must follow this.
- Buttons `btn-primary`/`btn-secondary` are pills. Radii tokens: lg 20px / xl 26px.
- PWA chrome color is `#07040D`, lives in `apps/web/index.html` + `apps/web/public/manifest.webmanifest`, and is asserted in `apps/web/src/__tests__/manifest.test.ts` — keep them in sync if it ever changes.

## Cross-Domain Behavior

Cross-domain signals are emitted by a source module and handled by the module that **owns the reaction's output**. Most reactions create tasks, so they live in Tasks (`tasks/services/CrossDomainEventHandlers.ts`); when the reaction's output belongs to another domain, that domain owns the subscriber (e.g. a wallet-side suggestion lives in `wallet/services/WalletCrossDomainEventHandlers.ts`). The direction is no longer Tasks-only.

Live signals handled by Tasks (`CrossDomainEventHandlers`):

- `wallet.spending.spike` → high-priority review task + warning insight.
- `health.habit.streak_broken` → habit recovery task + warning insight.
- `health.habit.milestone` → achievement insight.
- `health.counter.milestone` → achievement insight (includes money-not-spent when the counter has a daily cost).
- `health.goal.deadline_approaching` → decision task + warning insight.

Live signals handled by Wallet (`WalletCrossDomainEventHandlers`):

- `tasks.task.completed` with a payment-intent title → `suggestion` insight offering to register the expense, deep-linked to a pre-filled quick-add (`?registrar-gasto=<title>`). Detection is the title heuristic in `wallet/services/payment-intent.ts`; the wallet never auto-writes the transaction (the amount is unknown — suggest, don't write).

Future cross-domain signals should follow the same pattern:

- Emit a domain event from the source module (`{domain}/domain/events/`, payload type exported and imported directly by the subscriber; that coupling is accepted). Carry enough payload for the subscriber to act without reading back.
- Subscribe in the reaction-owning module's `*CrossDomainEventHandlers` via `eventBus`.
- Run actions through CQBus commands/queries or reusable services, never direct DB writes. Side effects inside handlers are fire-and-forget with a `.catch`/try-catch + logger (the insight must land even if a follow-on action fails).
- Insight metadata supports `actionHref`/`actionLabel` for deep links.
- Tests on both sides: emission in the source module's unit tests, handling in the owning module's `*CrossDomainEventHandlers.test.ts`, and the full flow in an e2e that boots both modules (note: poll briefly — handler side effects are async).

## New Domain Gate

A domain is only real when it matches the Tasks template:

1. Module registered in `DefaultCoreConfiguration`.
2. Drizzle schema and migration applied.
3. Domain entity with immutable `fromSnapshot()` / `toSnapshot()`.
4. Repository interface, Drizzle implementation, and fake repository.
5. Backend use cases exposed as CQBus `Command`/`Query` handlers under `app/`, with reusable `services/` collaborators only when they remove real duplication.
6. HTTP controller using auth-derived CQBus `ExecutionContext` and handlers using `requireUserIdentity`.
7. Cross-user isolation tests.
8. Frontend module following the `core/` + presenter pattern (ARCHITECTURE.md §4): domain + gateway, app handlers + `{Module}Module` registered in `createAppCore`, presenter + ViewModel + humble screen under `ui/screens/{module}`.
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
