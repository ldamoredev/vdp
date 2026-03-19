# Tasks Module Architecture

`Tasks` is the reference module for the project.

## Backend shape

The backend follows this flow:

1. `domain`
   Domain entity and repository contracts.
2. `services`
   Business use cases only.
3. `infraestructure/routes`
   Thin HTTP adapters: validate, call service, respond.
4. `infraestructure/agent`
   Thin AI adapter: system prompt + tools over the same services.
5. `events`
   Domain events emitted from task lifecycle transitions.
6. `services/TaskInsightsStore` + SSE
   Real-time insights for the frontend shell.

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

## Reintroduction criteria for new domains

Do not restore Wallet, Health, or other domains to the main navigation until they match the Tasks template:

1. Shared request schemas
2. Thin controller layer
3. Service-driven business logic
4. Stable response contract
5. Agent route
6. Tests
7. Build-green frontend integration
