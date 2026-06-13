---
name: create-service-api
description: Scaffold one backend use-case service in an existing server module (one class per use case, registered in the module runtime, exposed through a controller, with shared Zod contracts and a unit test). Use when the owner asks to add a backend service, use case, or endpoint to a domain.
---

# create-service-api

Scaffolds a single backend use case in an existing `server/src/modules/{domain}` module, following the Tasks/Health reference shape. One class per use case.

> Note: when the architecture track reaches A6 (CQBus on the api), this skill switches from "service class + ServiceProvider" to "Command/Query + handler". Until then, generate the current shape below.

## Inputs (ask if missing)

- **domain** (existing module: tasks, wallet, health, auth).
- **use case name** (imperative: `ArchiveGoal`, `GetWeeklySummary`).
- **inputs/outputs** and which repositories/services it needs.
- whether it is a **read** (returns a view) or a **write** (mutates + may emit a domain event).

## Files to create / touch

1. `server/src/modules/{domain}/services/{UseCase}.ts` — the service class.
2. `server/src/modules/{domain}/{Domain}ModuleRuntime.ts` — register it in `registerServices()`.
3. `server/src/modules/{domain}/infrastructure/routes/{Domain}Controller.ts` — add the route (thin adapter) if it's HTTP-exposed.
4. `packages/shared/src/schemas/` + `types/` — request/response Zod schema and cross-package types; re-export from the package index.
5. `server/src/modules/{domain}/__tests__/services/{UseCase}.test.ts` — unit test with a fake repository.
6. e2e case in `{domain}/__tests__/e2e/{Domain}API.e2e.test.ts` when the route is new.

## Hard rules

- **One responsibility per service class**; depends on repository **interfaces** and other services, never Drizzle tables directly.
- **`userId` comes from the controller's auth context** (`request.auth.userId!` / `authContextStorage`), passed in as the first argument — never from body/query/params.
- Validate inputs with the shared Zod schema at the controller; services receive typed data.
- Dates: validate/format with the `common/base/time` helpers; future-date and range rules live in the service (see `CreateGoal`).
- Time-based signals follow the no-scheduler patterns (write-time detection, or lazy detection on overview load with a persisted dedupe column) — see AGENTS.md "Insights And Time-Based Signals".
- Controllers stay thin: parse → call `services.get(UseCase).execute(...)` → `reply.send`.

## Steps

1. Write the failing unit test first (`tdd-workflow`): construct the service with a fake repository, assert behavior and invariants.
2. Implement the service class until green.
3. Add the shared schema + types; `pnpm --filter @vdp/shared build`.
4. Register in the module runtime; wire the controller route.
5. Add the e2e case if the route is new (boot `TestApp` + `TestCoreConfiguration`, auth via `x-test-user-id`).

## Self-check

- Fake repo used in the unit test (in `{domain}/__tests__/fakes/`), no Docker for unit.
- Cross-user isolation covered if the use case touches user-owned data.
- No `userId` from caller input; no cross-currency sums.
- Response shape lives in `@vdp/shared`, not redefined.

## Verification

`pnpm typecheck` → `pnpm --filter @vdp/server test:unit` → DB suites (`db:test:up` then `test:integration`/`test:e2e`) only if the DB is touched. Then run `code-review`.
