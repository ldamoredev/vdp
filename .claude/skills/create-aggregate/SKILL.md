---
name: create-aggregate
description: Scaffold a domain entity/aggregate — backend (rich entity + repository + Drizzle impl + the three synchronized DB changes + fake + test) or the lighter web variant (core/domain model + collection functions + test). Use when the owner asks to add a new domain entity or aggregate on either side.
---

# create-aggregate

Scaffolds a domain entity following the repo's dual style. **First decide rich vs. plain**: a rich entity is warranted only when it owns state transitions or invariants (Tasks `Task`, Health `Goal`); otherwise recommend plain `readonly` types with logic in services/functions and stop. Don't create anemic classes.

## Backend aggregate

### Files to create / touch

1. `server/src/modules/{domain}/domain/{Entity}.ts` — entity with immutable `fromSnapshot()` / `toSnapshot()` and behavior methods (`complete()`, `drop()`, `isActive()` — see `Goal`).
2. `server/src/modules/{domain}/domain/{Entity}Repository.ts` — repository interface + data types.
3. `server/src/modules/{domain}/infrastructure/db/Drizzle{Entity}Repository.ts` — Drizzle implementation.
4. `server/src/modules/{domain}/infrastructure/db/schema.ts` — add the table; then `pnpm db:generate`.
5. `server/src/modules/{domain}/infrastructure/db/bindings.ts` — bind the repo token to the Drizzle impl (`registry.register(...)`).
6. `server/src/modules/{domain}/__tests__/fakes/Fake{Entity}Repository.ts` — fake for unit tests.
7. `server/src/modules/{domain}/__tests__/domain/{Entity}.test.ts` — entity unit test (transitions/invariants).

### The three synchronized DB changes (the known failure mode)

A new table requires **all three**, or tests pass while prod breaks (or vice versa):

1. Drizzle schema at `{domain}/infrastructure/db/schema.ts` + `pnpm db:generate` (new migration; never edit committed migrations).
2. The handwritten `SETUP_SQL` snapshot in `server/src/test/test-database.ts`.
3. The `TRUNCATE` list in the same file.

### Hard rules

- Immutable snapshots; `fromSnapshot`/`toSnapshot` round-trip. Money per-currency. Dates via `common/base/time`.
- Repository is an interface in `domain/`; the Drizzle impl is the only thing that knows tables.

## Web variant (lighter — `core/domain/{module}`)

For the frontend `core/domain` layer (post-A2). No persistence: the gateway handles I/O.

### Files

1. `apps/web/src/core/domain/{module}/{Entity}.ts` — rich class (`private constructor` + `static from(dto)`, behavior/classification methods) **or** a plain type aliasing the `@vdp/shared` wire shape, plus pure collection functions (`sort*`, `summarize*`).
2. `apps/web/src/core/domain/{module}/__tests__/{Entity}.test.ts` — pure unit test.

### Hard rules

- Reuse `@vdp/shared` shapes; do not redefine response types.
- **No React, no Spanish/UI strings** in `core/domain` — classification and ordering only; labels live in the presenter.
- Copy arrays before sorting.

> The web variant is written after the first end-to-end module exists (A2 done). See [ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) §4 (step 1 — domain).

## Steps & verification

Entity test first (`tdd-workflow`), then implement. Backend: `pnpm typecheck` → `test:unit` → `db:test:up` + `test:integration` for the Drizzle repo. Web: `pnpm typecheck:web` → targeted `vitest run`. Then `code-review`.
