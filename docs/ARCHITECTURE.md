# Tasks Module Architecture

`Tasks` is the reference module for the project.

## Backend shape

The backend follows this flow:

1. `domain`
   Domain entity and repository contracts.
2. `services`
   Business use cases only.
3. `infrastructure/routes`
   Thin HTTP adapters: validate, call service, respond.
4. `infrastructure/agent`
   Thin AI adapter: system prompt + tools over the same services.
5. `events`
   Domain events emitted from task lifecycle transitions.
6. `services/TaskInsightsStore` + SSE
   Real-time insights for the frontend shell.

Each module boots through a shared lifecycle:

1. `registerServices()`
2. `registerEventHandlers()`
3. `registerAgents()`
4. `getControllers()`
5. `getDescriptor()`

Shared runtime dependencies are passed through a single module context:

- repositories
- services
- eventBus
- agentRegistry
- sseBroadcaster
- llmTraceService
- traceService
- agentProvider
- embeddingProvider
- logger

Active modules are selected in the server configuration, not hardcoded in `Core`.
`Core` is responsible for building the shared `ModuleContext`, bootstrapping the configured modules in order, and exposing their controllers/descriptors to `App`.

Event subscribers follow one shared contract:

- `subscribe()`

Modules register event subscribers through the shared module helper instead of wiring ad hoc subscriptions inline.

Shared request schema primitives live in `packages/shared/src/schemas/common.ts`.
Use them for repeated concerns like UUID params, date strings, date ranges, and bounded day windows before creating domain-specific schemas.

Modules also expose a small descriptor for shared application concerns like status reporting and module discovery.

Shared HTTP response helpers live in `server/src/modules/common/http/responses.ts`.
Use them for stable patterns like created resources, message payloads, paginated collections, carry-over summaries, and status responses.

## Rules

- Controllers do not contain business logic.
- Request validation uses shared `zod` schemas from `packages/shared`.
- The canonical list response for Tasks is:
  - `tasks`
  - `total`
  - `limit`
  - `offset`
- Canonical task statuses are:
  - `pending`
  - `done`
  - `carried_over`
  - `discarded`
- The live chat route for Tasks is `POST /api/v1/tasks/agent/chat`.

## Frontend shape

The frontend is currently Tasks-first:

- `/tasks`: active daily list
- `/tasks/history`: historical review
- `/home`: Tasks-only operational summary

The shell, chat panel, and notifications remain shared, but only Tasks is active in navigation.

## Frontend API conventions

Every active domain should follow the same frontend contract rules:

1. One domain client in `apps/web/src/lib/api/<domain>.ts`
2. Shared request transport in `apps/web/src/lib/api/client.ts`
3. Shared error shape:
   - `error`
   - `message`
   - `details`
4. Domain list responses must use a canonical collection key instead of ad hoc wrappers
5. Frontend status enums must match backend enums exactly
6. Chat UI should consume the shared SSE event contract:
   - `text`
   - `tool_use`
   - `tool_result`
   - `done`
   - `error`

Backend HTTP controllers follow one common shape:

- `register(app)`

`App` owns the Fastify instance, registers common controllers, asks `Core` for module controllers, wires the global HTTP error handler, and manages start/stop lifecycle.

## Test template

Every domain should match the Tasks test baseline before it is considered active:

1. Unit tests for domain entities and services
2. Integration tests for repository implementations
3. E2E API tests for HTTP routes
4. E2E coverage for the agent chat route if the domain exposes chat

Minimum commands:

- `pnpm --filter @vdp/server test:unit`
- `pnpm --filter @vdp/server test:integration`
- `pnpm --filter @vdp/server test:e2e`
- `pnpm --filter @vdp/server build`
- `pnpm --filter @vdp/web build`

## New domain checklist

Before enabling a new domain in the shell, confirm all of the following:

1. Shared schemas exist in `packages/shared`
2. Repository contracts live in `domain`
3. Service layer owns business logic
4. HTTP routes are thin adapters over services
5. Validation uses the shared HTTP helpers
6. Errors use the shared HTTP error contract
7. Agent chat uses the shared SSE chat handler
8. The module boots through the shared module lifecycle
9. A controller exists for status, routes, and SSE/chat needs as applicable
10. Frontend API types match backend response contracts exactly
11. Unit, integration, and e2e tests are green
12. The domain is only added to navigation after the above is complete

## Reintroduction criteria for new domains

Do not restore Wallet, Health, or other domains to the index navigation until they match the Tasks template:

1. Shared request schemas
2. Thin controller layer
3. Service-driven business logic
4. Stable response contract
5. Agent route
6. Tests
7. Build-green frontend integration
