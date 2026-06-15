---
name: create-presenter-web
description: Scaffold a frontend presenter + ViewModel + humble view for one screen section (PresenterBase over the Core, a usePresenter hook, a section/leaf component, and a React-free presenter unit test). Use when the owner asks to add a presenter, screen, or section to the web app.
---

# create-presenter-web

Scaffolds the UI layer for one **section** of a screen, following the A2 Health pilot. One presenter + ViewModel per sub-domain — never one God-presenter. See [ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) §4 (step 4 — UI).

## Inputs (ask if missing)

- **module + section** (`health/goals`).
- which use cases (Commands/Queries) it dispatches.
- the section's state: lists, form fields, busy/flow state, and any cross-section signal it emits or listens to.

## Files to create / touch

1. `apps/web/src/ui/models/{module}/{Section}ViewModel.ts` — flat, pre-formatted: display strings (with emoji), Spanish labels, `canCreate` booleans, per-item `busy`. No domain objects leak to the view.
2. `apps/web/src/ui/screens/{module}/{section}/{Section}Presenter.ts` — `extends PresenterBase<{Section}ViewModel>`, ctor `(onChange, core[, events])`. Private fields hold domain models + state; `initModel()` returns the initial VM; `start()` dispatches the load query (and subscribes to events); `stop()` clears timers/unsubscribes; action methods dispatch commands then re-query; every change → `this.refresh()` → `this.updateModel(this.buildModel())`. Spanish labels built here.
3. `apps/web/src/ui/screens/{module}/{section}/use{Section}Presenter.ts` — `usePresenter((onChange) => new {Section}Presenter(onChange, useCore()[, useHealthEvents()]), undefined, [core, events])`.
4. `apps/web/src/ui/screens/{module}/{section}/{Section}Section.tsx` — owns the hook; reads `presenter.model`, delegates to methods. Leaf components take a VM slice + callbacks.
5. `apps/web/src/ui/screens/{module}/{section}/__tests__/{Section}Presenter.test.ts` — no React.

## Hard rules

- **Presenter is React-free** and never touches HTTP/storage — it dispatches via `core.execute(...)` and subscribes to `ui/events` observables only.
- **StrictMode-idempotent**: `start`/`stop`/`start` must be safe — idempotent GET loads; subscriptions key off `this`; `stop()` cleans up timers and unsubscribes.
- **Humble views**: render VM and call presenter methods; zero logic in JSX beyond VM flags; forms `e.preventDefault()` then call the presenter.
- **Labels and formatting live in the presenter/VM**, not the view, not `core/`.
- **Cross-section coordination** goes through `ui/events/{Module}Events` (a shared observable via context) — only add a signal when a real cross-section dependency exists (YAGNI).

## Steps (TDD)

1. Failing presenter test first: build a Core with `.use(new {Module}Module(fakeGateway))`, `new {Section}Presenter(vi.fn(), core, events)`, `init(undefined)`, drive `start()`/actions, assert VM transitions. Cover: lifecycle/loading, one happy action + re-query, a busy-flag transition, an error path, and any event emit/subscribe (with `stop()` unsubscribe).
2. Implement the presenter + VM until green.
3. Write the humble section/leaf components.
4. Wire into the screen (composition) under the events provider.

## Verification

`pnpm typecheck:web` → `vitest run src/ui/screens/{module}` → full `pnpm --filter @vdp/web test` → `pnpm lint` → grep no-React under `core/` → `vite build` → browser smoke. Then `code-review`.
