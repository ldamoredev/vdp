---
name: create-service-web
description: Scaffold one frontend application use case (a CQBus Command/Query + handler over the module gateway, registered in the module, with a fake-gateway unit test) and, when needed, the gateway port method + HTTP impl. Use when the owner asks to add a frontend use case or wire a new API call into the Core.
---

# create-service-web

Scaffolds one frontend use case in `apps/web/src/core/app/{module}`, mirroring `create-service-api` so the api↔web use-case correspondence stays 1:1. Based on the A2 Health pilot; see [ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) §4 (steps 2–3).

## Inputs (ask if missing)

- **module** (health/tasks/wallet are migrated; review/home/etc. as they migrate).
- **use case name** (`ArchiveGoal`) and whether it's a **Query** (read → returns a view/model) or **Command** (write → usually `void`; return a model only if a flow needs it immediately, like `CompleteGoal`).
- inputs and the gateway operation it calls.

## Files to create / touch

1. `apps/web/src/core/app/{module}/{UseCase}.ts` — a `Command<T>`/`Query<T>` subclass carrying inputs + a thin `RequestHandler` that takes the gateway and calls one port method.
2. `apps/web/src/core/domain/{module}/{Module}Gateway.ts` — add the port method + input type if new.
3. `apps/web/src/core/infrastructure/http/Http{Module}Gateway.ts` — implement the new port method (wire→domain via `{Entity}.from` where rich).
4. `apps/web/src/core/app/{module}/{Module}Module.ts` — register the handler in `register(core)`.
5. `apps/web/src/core/app/{module}/__tests__/fakes/Fake{Module}Gateway.ts` — add the method (record the call).
6. `apps/web/src/core/app/{module}/__tests__/{module}-handlers.test.ts` — add a case (real bus + fake gateway).

## Hard rules

- Handlers are **thin**: one file per use case, one gateway call. No domain logic in the handler (that's the domain models / presenter).
- Reads return domain models; writes return `void` unless a flow needs the result.
- **No React anywhere under `core/`.**
- The new handler must be registered in `{Module}Module`, and the module must be in `createAppCore` — otherwise `RequestHandlerNotRegisteredError` at runtime (unit tests with hand-built Cores won't catch a missing `createAppCore` registration; `createAppCore.test.ts` does).
- Reuse `@vdp/shared` wire types in the gateway; never redefine response shapes.

## Steps

1. Failing handler test first (`tdd-workflow`): `new Core({...}).use(new {Module}Module(fakeGateway))`, `core.execute(new UseCase(...))`, assert routing + arg forwarding (+ returned model for queries).
2. Add the port method + HTTP impl (with a `Http{Module}Gateway` test asserting method/url/body).
3. Implement the Command/Query + handler; register in the module.
4. Confirm the module is wired in `createAppCore`.

## Verification

`pnpm typecheck:web` → targeted `vitest run src/core/app/{module}` and `src/core/infrastructure/http` → full `pnpm --filter @vdp/web test`. Then `code-review`.
