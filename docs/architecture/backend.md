# Backend Architecture

Updated: 2026-03-27

## Purpose

This document describes the current target backend architecture for `server/`.

It reflects the current codebase, including `Tasks` and `Wallet`.

## Stack

- Fastify 5
- TypeScript
- Drizzle ORM
- PostgreSQL
- pgvector

## Backend Role In The System

The backend is the primary domain runtime.

It owns:

- domain services
- repositories
- agent registration
- event bus and event subscribers
- HTTP routes
- SSE endpoints
- provider wiring for LLM and embeddings

The frontend should not duplicate this logic.

## Root Boot Flow

Application boot starts at:

- `server/src/main.ts`

Current flow:

1. create `Core` with `DefaultCoreConfiguration`
2. create `App`
3. run through `AppRunner`

## Core Architecture

The central runtime object is:

- `server/src/modules/Core.ts`

`Core` is responsible for constructing shared runtime infrastructure once:

- `EventBus`
- `AgentRegistry`
- `SSEBroadcaster`
- `ServiceProvider`
- `RepositoryProvider`
- tracing services
- logging
- provider adapters

Then `Core` creates a single `ModuleContext` and bootstraps domain modules through configured factories.

## ModuleContext

Shared runtime dependencies are passed through:

- `server/src/modules/common/base/modules/ModuleContext.ts`

This is the project’s explicit dependency-injection boundary.

Important rule:

- shared runtime dependencies are instantiated in core/configuration and injected
- domain modules should not allocate their own hidden global singletons

## Module Lifecycle

Domain modules implement a consistent lifecycle through `BaseModule`.

Current order:

1. `registerServices()`
2. `registerEventHandlers()`
3. `registerAgents()`
4. controllers exposed through `getControllers()`
5. descriptor exposed through `getDescriptor()`

This is the canonical backend module contract.

## Default Runtime Configuration

Current production/default configuration lives in:

- `server/src/modules/DefaultCoreConfiguration.ts`

Today it registers:

- `TaskModule`
- `WalletModule`

Shared runtime dependencies currently include:

- `DrizzleRepositoryProvider`
- `Database`
- logger
- trace services
- agent provider
- embedding provider

## Module Runtime Pattern

Each active domain has a runtime object that owns service and controller wiring.

Examples:

- `server/src/modules/tasks/TaskModuleRuntime.ts`
- `server/src/modules/wallet/WalletModuleRuntime.ts`

This runtime class is where a module:

- registers services
- subscribes event handlers
- registers an agent
- creates controllers

This keeps the module class itself thin.

## Repository Pattern

Repositories are resolved by token from the repository provider.

Current provider:

- `server/src/modules/common/infrastructure/db/DrizzleRepositoryProvider.ts`

Current repository forms:

- Drizzle repositories for production/runtime
- fake repositories for unit tests

Benefits:

- testability
- explicit domain contracts
- module-level dependency injection

## HTTP Layer

HTTP controllers are module-owned and mounted through the shared app.

Current examples:

- `TasksController`
- `TasksAgentController`
- `TaskInsightsSSEController`
- `WalletController`
- `WalletAgentController`

Shared HTTP concerns live under `modules/common/http/`.

Important existing conventions:

- shared controller base class
- shared validation path
- shared error mapping
- SSE handled explicitly

## Agents

Agents are registered per module through the shared `AgentRegistry`.

Current active agents:

- Tasks agent
- Wallet agent

Agent registration happens inside each module runtime, not in a global “AI module”.

This is intentional. Agents are domain capabilities, not standalone products.

## Event-Driven Behavior

The system uses a shared event bus for cross-service and cross-domain reactions.

Current examples:

- Tasks lifecycle subscribers
- task insights broadcasting
- Wallet spending spike detection
- Tasks cross-domain handling for Wallet-originated events

This is the current path for cross-domain behavior. It should remain narrow and explicit.

Avoid introducing a generic orchestration engine before a real need exists.

## Tasks As The Reference Module

`Tasks` remains the deepest backend reference.

It includes:

- CRUD and lifecycle transitions
- notes
- embeddings and similarity search
- planning/review services
- SSE insights
- richer event subscriptions
- richer agent tooling

Tasks is the quality bar for backend architecture, but not every module must copy every Task-specific subsystem.

## Wallet As The Second Reference Module

`Wallet` now follows the same structural backend pattern.

It includes:

- module class + runtime
- repositories
- services
- controllers
- agent controller
- agent registration
- event handlers

Current Wallet surface includes:

- accounts
- categories
- transactions
- stats
- savings goals
- investments
- exchange rates

Wallet is intentionally shallower than Tasks, but the structure is now aligned.

## Testing Strategy

Current backend testing layers are:

- unit tests with fake repositories
- integration tests with real Postgres
- e2e tests with Fastify `app.inject()`

Current active test coverage now exists for both:

- Tasks
- Wallet

This is part of the module standard. A module should not be considered stable if it lacks backend verification depth.

## Operational Rules

These are current project rules, not suggestions:

1. do not use global mutable singleton domain state
2. instantiate shared dependencies in core/configuration and inject them
3. use local date helpers, never `toISOString().slice(0, 10)` for local-date logic
4. SSE routes using `reply.hijack()` must set CORS headers manually

## What Should Stay Shared

Good shared backend layers:

- core runtime infrastructure
- repository provider pattern
- service provider
- controller base classes
- error handling
- agent plumbing
- event bus infrastructure

## What Should Stay Domain-Specific

Do not prematurely generalize:

- task insights store
- task embeddings behavior
- task planning/review services
- wallet-specific stats and investment logic
- domain-specific agent tool sets

## Current Reference Rule

When introducing a new active domain, use this checklist:

1. module class
2. runtime class
3. repository contracts
4. Drizzle repositories
5. fake repositories
6. services
7. controllers
8. agent registration if needed
9. unit tests
10. integration and e2e tests before calling it stable
