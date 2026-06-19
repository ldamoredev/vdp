---
name: create-service-api
description: Scaffold one backend API use case in an existing server module using the CQBus pattern (Command/Query + RequestHandler in app/, runtime handler registration, thin HTTP controller, shared Zod contracts, and tests). Use when the owner asks to add a backend command/query, service/use case, or endpoint to a domain.
---

# create-service-api

Scaffolds a single backend use case in an existing `server/src/modules/{domain}` module. The API is CQBus-first: one `Command<T>` or `Query<T>` plus one `RequestHandler`, registered by the module runtime and called by a thin controller. `services/` may still hold reusable collaborators or legacy bridge code, but do not add new HTTP routes that call `ServiceProvider` directly.

## Inputs (ask if missing)

- **domain** (existing module: tasks, wallet, health, auth).
- **use case name** (imperative: `ArchiveGoal`, `GetWeeklySummary`).
- whether it is a **Command** (write/mutation) or **Query** (read).
- **inputs/outputs** and which repositories/services it needs.
- whether it is HTTP-exposed, agent-exposed, both, or internal only.
- whether a reusable `services/` collaborator already exists or should be extracted behind the handler.

## Files to create / touch

1. `packages/shared/src/schemas/` + `types/` — request/response Zod schema and cross-package types for HTTP/wire shapes; re-export from the package index.
2. `server/src/modules/{domain}/app/{UseCase}{Command|Query}.ts` — the request class and `RequestHandler`.
3. `server/src/modules/{domain}/{Domain}ModuleRuntime.ts` — register the handler in `registerHandlers()` with `deps.bus.registerHandler(...)`.
4. `server/src/modules/{domain}/infrastructure/routes/{Domain}Controller.ts` — add the route if HTTP-exposed; parse/validate and call the bus.
5. `server/src/modules/{domain}/infrastructure/agent/` — only if agent-exposed; call the same command/query through the bus.
6. `server/src/modules/{domain}/__tests__/app/{UseCase}{Command|Query}.test.ts` — unit/social test with fake repositories and a `UserIdentity`.
7. `server/src/modules/{domain}/__tests__/app/*cqbus-test-helpers.ts` — extend shared test setup if needed.
8. e2e case in `{domain}/__tests__/e2e/{Domain}API.e2e.test.ts` when the route is new or auth/isolation matters.

## Hard rules

- **Command/Query carries operation data only — never `userId`.**
- Handlers receive `identity` as the second argument and must call `requireUserIdentity(identity)` before touching user-owned data.
- HTTP controllers call `bus.execute(new UseCase(...), executionContextFromAuth(request.auth))`; route params may carry entity ids, never caller identity.
- Agent tools call the same command/query with `executionContextFromAuth(authContextStorage.getAuthContext())`.
- Validate HTTP inputs with shared Zod schemas at the controller; validate LLM tool dates separately in agent tools.
- Handlers depend on repository **interfaces** and real reusable services, never Drizzle tables directly.
- Use a reusable `services/` class only when it removes real duplication or owns domain orchestration used by multiple handlers/events/agents; otherwise keep the use case in the handler.
- Register handlers in `{Domain}ModuleRuntime.registerHandlers()`. `registerServices()` is compatibility/reusable-collaborator plumbing, not the new API surface.
- Queries read and return views/models; commands mutate and return `void` unless a caller needs the result immediately (e.g. complete-and-graduate flows).
- Dates: validate/format with the `common/base/time` helpers; future-date and range rules live in the service (see `CreateGoal`).
- Time-based signals follow the no-scheduler patterns (write-time detection, or lazy detection on overview load with a persisted dedupe column) — see AGENTS.md "Insights And Time-Based Signals".
- Controllers stay thin: parse → construct Command/Query → `bus.execute` → `reply.send` / `sendCreated` / `assertFound`.

## Steps

1. Write the failing app test first (`tdd-workflow`): construct the handler with fake repositories/services, call `.handle(new UseCase(...), identity)`, and assert behavior, invariants, events, and returned shape.
2. Implement the Command/Query + handler until green.
3. Add or update shared schema + types; run `pnpm --filter @vdp/shared build`.
4. Register the handler in `{Domain}ModuleRuntime.registerHandlers()`.
5. Wire the controller route with `executionContextFromAuth(request.auth)` and shared Zod validation.
6. Add an identity-forwarding controller test if this is a new controller/route family or if auth plumbing changed.
7. Add the e2e case if the route is new (boot `TestApp` + `TestCoreConfiguration`, auth via `x-test-user-id`).
8. If an agent exposes it, add/update the typed tool name, tool implementation, prompt rule, and tool tests via `create-agent-tool`.

## Self-check

- Fake repo used in the unit test (in `{domain}/__tests__/fakes/`), no Docker for unit.
- Cross-user isolation covered if the use case touches user-owned data.
- No `userId` in Command/Query constructor, body/query/params, or tool input; handler derives it from `identity`.
- Controller uses `executionContextFromAuth(request.auth)`.
- Handler registered in `registerHandlers()`; no `RequestHandlerNotRegisteredError` risk.
- No cross-currency sums.
- Response shape lives in `@vdp/shared`, not redefined.

## Verification

`pnpm typecheck` → targeted app/controller tests → `pnpm --filter @vdp/server test:unit` → DB suites (`db:test:up` then `test:integration`/`test:e2e`) only if the DB is touched. Then run `code-review`.
