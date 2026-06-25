# VDP Architecture

Single source of truth for how the system is built — backend (API) and frontend (web). Hard rules and conventions live in [`AGENTS.md`](../../AGENTS.md); this document explains the **shape, layers, and data flow** and the procedure for adding to each side. It replaces the former `frontend-mirror-analysis.md` (planning/decisions) and `frontend-module-template.md` (procedure), now folded in here.

---

## 1. System overview

VDP is a personal "life operating system": a pnpm + Turborepo monorepo with three packages.

```text
apps/web/        Vite SPA (React 19, react-router 7, Tailwind v4). No SSR.
server/          Fastify 5 API (modular monolith over PostgreSQL + Drizzle).
packages/shared/ Cross-package contracts: response types + Zod schemas + agent-tool registry.
```

- **Same-origin, no BFF.** The SPA calls `/api/v1/...` with relative paths. In dev, Vite proxies `/api` to Fastify (`VITE_API_PROXY_TARGET`, default `http://localhost:4000`). In prod, Fastify serves the built SPA itself (`registerSpaStatic` in `server/src/App.ts`), so same-origin holds with no config.
- **Auth is cookie-native.** Login/register set the `vdp_session` httpOnly cookie; `SessionTokenAuthenticationMiddleware` accepts the cookie or `x-session-token`. The SPA `AuthGate` handles client-side redirect to `/login`.
- **Deployed** as a single Railway service (SPA build + API) at vdpapp.com.ar.

Both sides share one organizing idea: **a modular monolith where each domain owns its full vertical**, and the frontend deliberately **mirrors the backend** (domain → application use cases → infrastructure adapter), so the api↔web correspondence stays roughly 1:1.

---

## 2. Shared contracts — `packages/shared`

- API response shapes live in `packages/shared/src/types/` and are re-exported on the web via `apps/web/src/lib/api/types.ts`. **Never redefine server response shapes in web code.**
- Zod schemas for request validation live in `packages/shared/src/schemas/`.
- Agent tool names live in `packages/shared/src/constants/agent-tools.ts`; server tool definitions and web tool handling both typecheck against that registry.

---

## 3. Backend (API) architecture — `server/`

### Composition

`server/src/modules/Core.ts` owns shared infrastructure: `CQBus`, `EventBus`, `AgentRegistry`, `SSEBroadcaster`, `RepositoryProvider`, `AuthContextStorage`, `ModuleContext`, LLM + OpenTelemetry services. `DefaultCoreConfiguration` wires the concrete infrastructure (`Database`, repository registry, logger, agent/embedding providers, auth storage) and the **active module factories** — register modules only there. Repository wiring is per-module (`{domain}/infrastructure/db/bindings.ts`), composed in `modules/DefaultRepositories.ts`. `modules/common/` must not import from domain modules; only the root composition files enumerate domains.

### Module shape

```text
server/src/modules/{domain}/
├── {Domain}Module.ts          # extends BaseModule: controllers, middlewares, handler/event/agent registration
├── {Domain}ModuleRuntime.ts   # wires repositories, CQBus handlers, reusable services, event handlers, controllers, agents
├── app/                       # one Command/Query + RequestHandler per exposed use case
├── domain/                    # {Entity}.ts + {Entity}Repository.ts (interface)
├── infrastructure/
│   ├── db/                    # schema.ts, bindings.ts, Drizzle{Entity}Repository.ts
│   ├── routes/                # thin HTTP controllers
│   └── agent/                 # domain agent + tools
├── services/                  # reusable collaborators behind handlers/events/agents
└── __tests__/
```

- **CQBus-first API use cases.** New HTTP-exposed work lives in `app/` as `Command<T>` or `Query<T>` plus `RequestHandler`, registered in `{Domain}ModuleRuntime.registerHandlers()`. Controllers validate with shared Zod schemas, construct the request, and call `bus.execute(..., executionContextFromAuth(request.auth))`. Handlers call `requireUserIdentity(identity)` before touching user-owned data. `Command`/`Query` classes never carry `userId`.
- **Services are collaborators, not the new HTTP surface.** Keep a service class when it owns reusable orchestration or domain logic used by multiple handlers/events/agents; otherwise keep the use case in its handler. Services depend on repository *interfaces* and other services, never on Drizzle tables directly.
- **Domain modeling — two deliberate styles.** Rich entity with behavior (`tasks/domain/Task.ts`: `complete()`, `carryOver()`, `isStuck()`) for domains with their own state transitions/invariants; plain `readonly` types + orchestration in CQBus handlers or reusable services (`wallet`, `auth`) when the domain is mostly coordination across repositories. Don't rewrite one into the other without a real reason. Entities use immutable snapshots (`fromSnapshot()`/`toSnapshot()`).

### Auth context

`AuthContextStorage` propagates auth via `AsyncLocalStorage`. **`userId` always comes from `authContextStorage.getAuthContext()` / `request.auth` / CQBus `Identity`** — never from body, params, query, or LLM tool input. HTTP controllers pass `executionContextFromAuth(request.auth)` to the bus; handlers call `requireUserIdentity(identity)`. Cross-user isolation tests are required for anything touching user-owned data. Agent chat handlers wrap the loop in `authContextStorage.runWithContext(request.auth, ...)`.

### Agents

Domain agents extend `BaseAgent` (`domain`, `systemPrompt`, `tools`) and register through `AgentRegistry` in the module runtime (Tasks, Wallet, and Health have agents; Auth does not). Tool factories close over `CQBus` + `AuthContextStorage`, execute the same commands/queries as HTTP, and derive execution context internally. **System prompts must be builder functions evaluated per chat** (a module-level template literal freezes "today" at boot). Tools validate LLM-provided dates with `localDateStringSchema` before dispatching commands/queries.

### Insights & time-based signals

There is **no scheduler/cron**. Two patterns: (1) **write-time detection** on a user action (streak breaks/milestones computed on completion, only for `date === today`); (2) **lazy detection on overview load** for signals that need time to pass (dedup state persisted in a column, saved *before* emitting). Insight stores are in-memory read models backed by Postgres, hydrated at boot.

### Database

PostgreSQL schemas: `core` (users, sessions, audit, agent conversations/messages), `tasks`, `projects`, `wallet`, `health`. Adding a table needs **three synchronized changes**: Drizzle schema (`{domain}/infrastructure/db/schema.ts`) + `pnpm db:generate`; the `SETUP_SQL` snapshot in `server/src/test/test-database.ts`; and the `TRUNCATE` list in the same file. Don't edit committed migrations — generate a new one.

---

## 4. Frontend architecture — `apps/web/`

A Vite SPA that mirrors the backend module pattern with **presenters + a command/query bus (CQBus) + a `core/` composition root**. React Query is being retired module by module as part of this migration.

### Top-level layout of `apps/web/src/`

```text
main.tsx          Entry: mounts <WebApp/> under React StrictMode.
WebApp.tsx        ThemeProvider + CoreProvider + (TasksEventsProvider) + Providers + RouterProvider.
routes.tsx        Whole route tree (createBrowserRouter); each route renders a screen from ui/screens/*.
createAppCore.ts  App composition root: new Core().use(HealthModule).use(TasksModule).use(WalletModule).use(ProjectsModule).
CoreProvider.tsx  Exposes the Core via context (useCore()).

core/             NO React anywhere under here (grep/lint enforced).
  Core.ts                       composition root: CQBus + httpClient + LoggingMiddleware + use(module)
  domain/{module}/              rich class (behavior) OR plain type (data) + pure collection functions
    {Module}Gateway.ts          port interface + input/result types
  app/{module}/                 one Command/Query + RequestHandler per use case
    {Module}Module.ts           CoreModule: builds the gateway, registers handlers on the bus
  infrastructure/http/
    Http{Module}Gateway.ts      implements the port over HttpClient (wire→domain anti-corruption)
    FetchHttpClient.ts          HttpClient over fetch, /api/v1 base, same-origin credentials

ui/               Everything React.
  primitives/     design-system leaves (module-page, state-card, collection-card, theme-toggle)
  shell/          app chrome: domain-layout, header, rails, error boundaries, providers + auth-gate
  chat/           agent chat shell (future module; pure logic can later drop to core/)
  events/         {Module}Events.ts — observable cross-section invalidation channels (RQ replacement)
  models/{module}/  ViewModels: the view's pre-formatted data contract
  screens/{module}/ {Module}Presenter.ts + use{Module}Presenter.ts + {Module}Screen.tsx + components/

lib/              Framework-agnostic kernel: api/client + api/types, format, navigation, theme, providers.
```

Top-level is **`core/` + `ui/` + `lib/`** (plus entrypoints and `__tests__`). There is no `pages/`, `components/`, or `features/` layer — route screens live in `ui/screens/*` and `routes.tsx` imports them directly. **Module-owned components co-locate in `ui/screens/{module}/components/`; shared leaves go in `ui/primitives/`; app chrome goes in `ui/shell/`.**

### Data flow

View → `presenter.method()` → `core.execute(new SomeCommand(...))` → CQBus routes to the handler → handler calls one gateway port method → `HttpGateway` hits `/api/v1` and maps the wire DTO to a domain model → presenter updates its private state → `refresh()` rebuilds the ViewModel → view re-renders. There is no React Query cache to invalidate.

### The five steps for a module (procedure the A4 skills generate against)

1. **Domain — `core/domain/{module}`.** Models reuse the `@vdp/shared` wire shape. Dual style: **rich class** (`private constructor` + `static from(dto)`) when it owns behavior/classification; **plain type** when the view only reads it, with collection logic as pure exported functions beside it. **No Spanish/UI strings here** — classification and ordering only; labels are the presenter's job; copy arrays before sorting. The `{Module}Gateway` port lists every operation (reads return domain models; writes return the affected entity or `void`).
2. **Infrastructure — `core/infrastructure/http/Http{Module}Gateway`.** Implements the port over `HttpClient`; the anti-corruption boundary mapping wire DTOs to domain models so DTO shapes never leak. Tested with a fake `HttpClient` asserting method/url/body + the mapping.
3. **Application — `core/app/{module}`.** One file per use case: a `Command<T>`/`Query<T>` carrying inputs + a thin `RequestHandler` that calls one port method. `{Module}Module` (a `CoreModule`) builds the HTTP gateway from `core.httpClient` and registers every handler; accepts an injected gateway for tests. **Register it in `createAppCore`** — forgetting it throws `RequestHandlerNotRegisteredError` at runtime (guarded by `createAppCore.test.ts`). Tested through the real bus with a fake gateway.
4. **UI — `ui/models/{module}` + `ui/screens/{module}`.** **One presenter per section, not a God-presenter.** Each section gets a ViewModel (flat, pre-formatted primitives — display strings, Spanish labels, `canX` booleans, per-item `busy`; no domain objects leak), a `{Section}Presenter extends PresenterBase<VM>` (holds domain models + form/busy state; `initModel()`, `start()` loads + subscribes, `stop()` cleans up, action methods dispatch then re-query, every change calls `refresh()`), a `use{Section}Presenter()` hook bridging `usePresenter` + `useCore`, and a humble view (reads `presenter.model`, zero logic beyond VM flags). **Presenters must be StrictMode-idempotent.** When sections of one screen share state, use a screen-local store of observables (e.g. `TasksDashboardStore`) that presenters subscribe to.
5. **Wire + delete.** Point the route in `routes.tsx` at the screen; delete any legacy implementation. Confirm: no dangling refs, no `@tanstack/react-query` under `core/`/`ui/`, no React under `core/`.

### Cross-section / cross-module coordination

`ui/events/{Module}Events.ts` — a `@nbottarini/observable` channel per signal, React-free, shared through a small context provider. The emitter presenter fires the signal; subscribers reload in `start()`. Create a channel **only when a real dependency exists** (YAGNI). The chat shell bridges agent mutations to presenters this way (`ui/chat/tasks-chat-sync-bridge.ts` emits `tasksChanged`), replacing the old React-Query cache surgery — marked temporary until the shell/chat migrates.

### Migration status (June 2026)

| Module | State |
|---|---|
| health, tasks, wallet, projects | **Fully migrated** — core/ + presenters, no React Query. |
| people, study, work | Moved to `ui/screens/*` with a **presenter returning mock data** (no backend yet — swap the presenter when one exists). |
| home, review, login, landing, settings | **Legacy, relocated as-is** under `ui/screens/*` — still React Query / plain components, not yet on the presenter pattern. |
| shell / chat | Legacy; `QueryClientProvider` stays app-wide in `lib/providers.tsx` for the not-yet-migrated modules. |

### UI conventions (essentials; full list in AGENTS.md)

Stack is Vite + React 19 + react-router 7 + Tailwind v4 + lucide-react (no Shadcn/Radix). Visual identity is "tinta iris" (tokens in `globals.css`): violet-cast ink, electric-iris accent, per-domain `.domain-{key}` accents; three type roles (Bricolage display / Inter body / JetBrains Mono for data via `.font-data`); every key metric wears `.font-data` and the body is `tabular-nums`.

---

## 5. Cross-cutting rules

- **Money is per-currency.** ARS and USD coexist; **never sum across currencies** — group or filter by currency (`buildInvestmentSummary` rolls up per currency; `buildVisibleTransactionTotal` flags `mixedCurrencies`; backend `DetectSpendingSpike` groups by currency).
- **Dates:** `getTodayISO()` / `localDateISO()` from `@/lib/format`; never `new Date().toISOString().slice(0,10)`.
- **The `core/` ratchet:** nothing under `core/` imports React or `ui/`; `ui/` never imports a deleted `features/`. Enforced by grep/lint in the per-module gate.
- **Tests mirror the source** at each layer: domain (pure), gateway (fake HttpClient), handlers (real bus + fake gateway), presenter (no React, fake-gateway-backed Core).

---

## 6. Cross-domain behavior

Live signals are emitted as domain events from the source module and handled by **Tasks** in `tasks/services/CrossDomainEventHandlers.ts`:

- `wallet.spending.spike` → high-priority review task + warning insight.
- `health.habit.streak_broken` → recovery task + warning insight.
- `health.habit.milestone` / `health.counter.milestone` → achievement insight.

New signals follow the same shape: emit from the source, subscribe in the handler, run actions through CQBus commands/queries or reusable services (task creation is fire-and-forget with `.catch`), tests on both sides.

---

## 7. Key decisions (rationale)

- **Vite SPA over Next.js.** No SSR need for a personal tool; Fastify serves the static build; single deploy. (Next App Router scaffolding fully removed.)
- **Presenters + CQBus + `core/` mirroring the backend.** Keeps UI logic React-free and unit-testable, and the api↔web use-case vocabulary aligned. The owner's `@nbottarini` libraries (`cqbus`, `react-presenter`, `observable`, `abstract-http-client`) are used as published.
- **React Query removed per module.** Presenters re-query after their own mutations; cross-section invalidation goes through `ui/events`. RQ remains only in not-yet-migrated modules.
- **Flat `core/` + `ui/` + `lib/`.** After the migration, the old `pages/` / `components/` / `features/` split collapsed into `ui/` (screens, primitives, shell, chat, models, events) — one presentation layer, ownership-based placement.
- **`FetchHttpClient`, not `@nbottarini/axios-http-client`** (the axios dep is CVE-bearing) — a thin fetch adapter over `@nbottarini/abstract-http-client`.

---

## 8. Verification ladder (per module)

`pnpm typecheck:web` → targeted `vitest run src/core/{...}` and `src/ui/screens/{module}` → full `pnpm --filter @vdp/web test` → `pnpm lint` → grep no-React-under-`core/` → `vite build` → browser smoke. A `code-review` pass (design / repo-rules / tests) gates every commit.
