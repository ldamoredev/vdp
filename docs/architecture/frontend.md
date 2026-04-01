# Frontend Architecture

Updated: 2026-03-27

## Purpose

This document describes the current target frontend architecture for `apps/web`.

It is based on the current codebase, not the older top-level docs.

## Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS 4
- TanStack React Query

## Frontend Role In The System

The frontend is a single Next.js app that provides:

- the shared application shell
- domain pages
- auth gate and login flow
- shared navigation
- interactive domain presentation
- chat UI integration

The frontend is not the primary domain backend. Domain business logic still lives in `server/`.

## Current Design Direction

The frontend currently follows these rules:

1. one shared app, not one frontend per domain
2. feature modules for active domains
3. thin route pages
4. split read/write contexts for interactive domains when needed
5. shared primitives only after at least two domains converge

## Root App Structure

Current high-level shape:

```text
apps/web/src/
├── app/                   # App Router routes and route shells
├── components/            # shared UI and primitives
├── features/              # domain-focused frontend architecture
├── lib/                   # API clients, helpers, query utilities
```

## App Router Boundaries

### Route files

`app/**/page.tsx` files should be composition roots, not logic containers.

Their job is to:

- choose the provider boundary
- choose the screen component
- define layout composition

Examples:

- `tasks/page.tsx`
- `tasks/history/page.tsx`
- `wallet/page.tsx`
- `wallet/transactions/new/page.tsx`

### Client boundaries

Pages currently still use client-side composition for the active modules, but the architectural preference is:

- keep Server Components as the default where practical
- push `'use client'` down to interactive leaves
- keep route-wide client state only when the feature really needs it

This repo is not fully server-first yet. That remains a direction, not a completed migration.

## Feature Module Convention

The canonical frontend reference is now:

- `features/tasks/presentation/`
- `features/wallet/presentation/`

Each active module should prefer this structure:

```text
features/{domain}/presentation/
├── components/
├── __tests__/
├── {domain}-context.tsx
├── use-{domain}-context.ts
├── use-{domain}-queries.ts
├── use-{domain}-mutations.ts
├── use-{domain}-creation.ts      # optional
├── use-{domain}-detail.ts        # optional
├── {domain}-query-keys.ts
├── {domain}-selectors.ts
```

### Why this exists

This structure is meant to keep:

- route files thin
- derived view logic centralized
- mutation wiring explicit
- selectors testable
- domain UI code grouped by module

## Context Pattern

The active modules now use a split-context pattern:

- `QueriesContext`
- `ActionsContext`

The rule is:

- read-heavy values go in the queries context
- stable handlers and mutation triggers go in the actions context

Shared strict access now lives in:

- `src/lib/react/use-required-context.ts`

This avoids repeating manual `useContext` null-guard logic.

## Query Keys

Query keys are now a first-class part of module structure.

Shared base helper:

- `src/lib/query-keys.ts`

Current module registries:

- `features/tasks/presentation/tasks-query-keys.ts`
- `features/wallet/presentation/wallet-query-keys.ts`

Rule:

- never scatter ad hoc string arrays for active modules when a module registry already exists

Benefits:

- consistent invalidation
- easier cache sync
- fewer typo-prone literal arrays

## API Client Layer

The API transport layer lives in:

- `src/lib/api/client.ts`
- `src/lib/api/tasks.ts`
- `src/lib/api/wallet.ts`

Shared conventions already extracted:

- query-param builder via `withQueryParams`
- paginated collection typing in `src/lib/api/types.ts`

Rule:

- API files should describe transport contracts
- feature modules should compose those APIs into UI behavior
- domain business rules should not migrate into these client files

## Shared UI Primitives

These primitives are now shared because both `Tasks` and `Wallet` use them:

- `src/components/primitives/module-page.tsx`
- `src/components/primitives/state-card.tsx`
- `src/components/primitives/collection-card.tsx`

Use them only when the visual and structural pattern is genuinely shared.

Do not create “universal” primitives for domain-specific screens.

## Current Module Status

### Tasks

Tasks is still the strongest frontend reference.

It already has:

- dashboard provider
- history provider
- tested selectors
- richer detail workflow
- richer chat-sync behavior

### Wallet

Wallet now follows the same architectural direction:

- feature-layer presentation
- query-key registry
- split contexts
- route-shell pages
- shared primitives

Wallet still has less feature depth than Tasks, but the structure now matches closely enough to be considered the second reference implementation.

## Recommended Next.js Style For This Repo

Because the project already has a dedicated backend, the frontend should prefer:

1. Next.js for routing, shell, and presentation
2. React Query for interactive client-side state where needed
3. server-side composition only where it clearly improves the route
4. Route Handlers only when Next is acting as a real BFF

Avoid:

- copying backend business logic into the frontend
- route pages with large amounts of state logic
- broad global contexts for data that belongs to a single feature
- generic abstractions before two real modules need them

## What Should Stay Domain-Specific

These are not good extraction targets yet:

- task planning/review selectors
- task chat cache sync semantics
- wallet investment calculations that are presentation-specific
- wallet transaction form workflow

## What Can Be Shared Later

Possible future shared frontend layers, but not mandatory yet:

- server-only read-model conventions under `src/server/`
- route-level data composition helpers
- a small domain screen/header convention

Those should only be extracted if a third module starts following the same pattern.
