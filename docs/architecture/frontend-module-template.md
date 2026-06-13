# Frontend Module Template

Extracted from the Health pilot (architecture track A2). This is the concrete shape every migrated frontend module follows — the reference the `create-service-web`, `create-presenter-web`, and web `create-aggregate` skills (A4) generate against. Companion to [frontend-mirror-analysis.md](./frontend-mirror-analysis.md); rules live there and in [AGENTS.md](../../AGENTS.md), procedure lives here.

## Layers and where code goes

```text
apps/web/src/
├── core/                                   # NO React anywhere under here (lint/grep enforced)
│   ├── Core.ts                             # composition root: CQBus + httpClient + middlewares + use(module)
│   ├── domain/{module}/
│   │   ├── {Entity}.ts                     # rich class (behavior) OR plain type (data) — dual style
│   │   └── {Module}Gateway.ts              # port interface + input/result types
│   ├── app/{module}/
│   │   ├── {UseCase}.ts                    # Command/Query + RequestHandler, one file per use case
│   │   └── {Module}Module.ts               # CoreModule: builds gateway, registers handlers on the bus
│   └── infrastructure/http/
│       └── Http{Module}Gateway.ts          # implements the port over HttpClient (wire→domain)
├── ui/
│   ├── models/{module}/{Module}ViewModel.ts # the view's pre-formatted data contract
│   └── screens/{module}/
│       ├── {Module}Presenter.ts            # all UI logic, React-free, dispatches via Core
│       ├── use{Module}Presenter.ts         # usePresenter + useCore bridge
│       ├── {Module}Screen.tsx              # humble root view
│       └── components/                      # humble views: render VM, delegate to presenter
└── pages/{module}-page.tsx                  # route component: <{Module}Screen/>, nothing else
```

Tests mirror the source, each layer at its own level:

```text
core/domain/{module}/__tests__/{Entity}.test.ts        # pure, no doubles
core/infrastructure/http/__tests__/Http{Module}Gateway.test.ts # fake HttpClient
core/app/{module}/__tests__/{module}-handlers.test.ts  # real bus + fake gateway
core/app/{module}/__tests__/fakes/Fake{Module}Gateway.ts
ui/screens/{module}/__tests__/{Module}Presenter.test.ts # no React, fake-gateway-backed Core
```

## The five steps (in order)

### 1. Domain — `core/domain/{module}`

Models reuse the `@vdp/shared` wire shape (never redefine response shapes). Dual style:
- **Rich class** when it owns behavior/classification (Health's `Goal`: `isActive`, `isOverdue`, `urgency()`). `private constructor` + `static from(dto)`.
- **Plain type** when it is data the views only read (`Habit`, `Counter` = the overview DTO). Collection logic (sort/summarize) lives as pure exported functions next to it.

Rule: **no Spanish-facing/UI strings here** — classification and ordering only. Labels are the presenter's job. Copy arrays before sorting.

The gateway port lists every operation: reads return domain models; writes return `void` (the presenter re-queries), except where a flow needs the result immediately (Health's `completeGoal` returns the `Goal` for the graduation offer).

### 2. Infrastructure — `core/infrastructure/http/Http{Module}Gateway`

Implements the port over `HttpClient`. The anti-corruption boundary: maps wire DTOs to domain models (`Goal.from`) so DTO shapes never leak past it. One method per port operation, thin. Test with a fake `HttpClient` asserting method/url/body and the domain mapping.

### 3. Application — `core/app/{module}`

One file per use case: a `Command<T>`/`Query<T>` subclass carrying its inputs + a `RequestHandler` that takes the gateway and calls one port method. Handlers are intentionally thin — they are the use-case vocabulary the presenter dispatches and the bus instruments. `{Module}Module` (a `CoreModule`) builds `Http{Module}Gateway` from `core.httpClient` and registers every handler; accepts an injected gateway for tests. Mount it in `WebApp`/Core wiring via `core.use(new {Module}Module())`.

Test through the real bus: `new Core({...}).use(new {Module}Module(fakeGateway))` then `core.execute(new SomeCommand(...))`, asserting routing + arg forwarding.

### 4. UI — `ui/models/{module}` + `ui/screens/{module}`

**One presenter per section, not per module.** A screen with distinct sub-domains (Health = habits / counters / goals) gets one autonomous presenter + ViewModel + hook + section component each, under `ui/screens/{module}/{section}/`. The screen is pure composition. Avoid a single God-presenter with one giant ViewModel — that is the SRP smell the `code-review` skill flags.

- **ViewModel** (per section): a flat object of already-formatted primitives (display names with emoji, Spanish labels, `canCreate` booleans, per-item `busy`). No domain objects leak to the view.
- **Presenter** (per section) extends `PresenterBase<{Section}ViewModel>`, constructed with `(onChange, core[, events])`. Holds domain models + form/busy/flow state as private fields. `initModel()` returns the initial VM; `start()` dispatches the load query (and subscribes to cross-section events); `stop()` clears timers/unsubscribes. Action methods dispatch commands then re-query. Every state change calls a private `refresh()` → `this.updateModel(this.buildModel())`. Spanish labels are built here. **Must be StrictMode-idempotent** (start/stop/start in dev): loads are idempotent GETs, subscriptions key off `this` and `stop()` cleans up.
- **Hook**: `use{Section}Presenter()` = `usePresenter((onChange) => new {Section}Presenter(onChange, useCore()[, useHealthEvents()]), undefined, [core, events])`.
- **Views**: read `presenter.model` and call `presenter.method()`. Zero logic beyond rendering VM flags. Forms do `e.preventDefault()` then call the presenter. Leaf components take a VM slice + callbacks; section components own their hook.

**Cross-section coordination** uses `ui/events/{Module}Events.ts` (a `@nbottarini/observable` `observable<void>` per signal, React-free) shared via a small context provider (`{Module}EventsProvider` + `use{Module}Events`). Health's only signal: graduating a goal creates a habit, so `GoalsPresenter` calls `events.emitHabitsChanged()` and `HabitsPresenter` subscribes in `start()` and reloads. Add a signal only when a real cross-section dependency exists (still YAGNI-gated — do not pre-create channels).

### 5. Wire + delete

Point `pages/{module}-page.tsx` at the screen. Delete the legacy `features/{module}` folder. Confirm: no `features/{module}` refs remain, no `@tanstack/react-query` under `core/`/`ui/`, no React under `core/`.

## Invalidation

Each presenter re-queries its own list directly after its mutations. Cross-section invalidation goes through `ui/events` (see step 4): the emitter presenter fires the signal, the subscriber reloads. Both are presenter-side; there is no React Query cache to invalidate.

## Verification ladder (per module)

`pnpm typecheck:web` → targeted `vitest run src/core/{...}` and `src/ui/screens/{module}` → full `pnpm --filter @vdp/web test` → `pnpm lint` → grep no-React-under-core → `vite build` → browser smoke.
