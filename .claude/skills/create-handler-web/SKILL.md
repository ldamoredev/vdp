---
name: create-handler-web
description: Scaffold one frontend application use case (a CQBus Command/Query + handler over the module gateway, registered in the module, with a fake-gateway unit test) and, when needed, the gateway port method + HTTP impl. Use when the owner asks to add a frontend use case or wire a new API call into the Core.
---

# create-handler-web

Scaffolds one frontend use case in `apps/web/src/core/app/{module}`, mirroring `create-handler-api` so the api↔web use-case vocabulary stays 1:1. Based on the migrated Health/Tasks/Wallet modules; see [ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) §4 (steps 2–3).

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
- **The new handler MUST be registered in `{Module}Module`** (`core.bus.registerHandler(UseCase, () => new UseCaseHandler(gateway))`), and the module must be in `createAppCore` — otherwise `RequestHandlerNotRegisteredError` at runtime. This is the step most easily skipped: typecheck stays green and the module's `{module}-handlers.test.ts` passes (it builds its own Core), so the gap only shows up in the running app. After adding the handler, grep `{Module}Module.ts` for the `registerHandler(UseCase` line to confirm it exists.
- **The dev server won't pick up a new registration via HMR.** `createAppCore` runs once inside `CoreProvider`'s `useState`, so the running Core is memoized from app boot; hot-reloading a screen does NOT re-run module registration. A new handler throws `RequestHandlerNotRegisteredError` in the running app even when the code is correct — do a **hard reload** (or restart `pnpm dev`) before concluding a registration is broken.
- Reuse `@vdp/shared` wire types in the gateway; never redefine response shapes.
- `Http{Module}Gateway` is the anti-corruption boundary: map DTOs into domain models there, not in presenters or handlers.
- Application tests should dispatch through a real `Core` + `{Module}Module(fakeGateway)`, not instantiate handlers directly; this catches registration drift and keeps the bus path honest.

## Steps

1. Failing handler test first (`tdd-workflow`): `new Core({...}).use(new {Module}Module(fakeGateway))`, `core.execute(new UseCase(...))`, assert routing + arg forwarding (+ returned model for queries).
2. Add the port method + HTTP impl (with a `Http{Module}Gateway` test asserting method/url/body and DTO→domain mapping).
3. Implement the Command/Query + handler; register in the module.
4. Confirm the module is wired in `createAppCore` or add a `createAppCore.test.ts` case if the whole module is new.

## Verification

`pnpm typecheck:web` → targeted `vitest run src/core/app/{module}` and `src/core/infrastructure/http` → full `pnpm --filter @vdp/web test`. Then `code-review`.
