# VDP

Current scope: `Tasks` only.

The project is temporarily reduced to the Tasks module so the architecture, API contract, validation flow, and agent chat path can be stabilized before the other domains come back.

## Workspace

- `apps/web`: Next.js frontend
- `server`: Fastify backend
- `packages/shared`: shared schemas and types

## Local bootstrap

1. Install dependencies

```bash
pnpm install
```

2. Start local infrastructure

```bash
pnpm infra:start
```

3. Run the backend

```bash
pnpm --filter @vdp/server dev
```

4. Run the frontend

```bash
pnpm --filter @vdp/web dev
```

## Tasks-only verification

```bash
pnpm --filter @vdp/server build
pnpm --filter @vdp/server test:unit
pnpm --filter @vdp/web build
```

## DB-backed tests

Integration and e2e tests expect Postgres on `localhost:5433`.

Start the test database with:

```bash
pnpm --filter @vdp/server db:test:up
```

Then run:

```bash
pnpm --filter @vdp/server test:integration
pnpm --filter @vdp/server test:e2e
```

## Key routes

- Web: `http://localhost:3000/tasks`
- Tasks overview: `http://localhost:3000/home`
- API health: `http://localhost:4001/api/health`
- Tasks API: `http://localhost:4001/api/v1/tasks`
- Tasks chat: `http://localhost:4001/api/v1/tasks/agent/chat`
- Tasks insights SSE: `http://localhost:4001/api/v1/tasks/insights/stream`
