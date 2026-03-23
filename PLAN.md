# VDP Plan

## 1. Current Status

VDP is currently a `Tasks-first` modular monorepo.

The project started with a broader "life OS" ambition across Tasks, Wallet, Health, People, Work, and Study. That vision still matters, but the codebase has intentionally narrowed scope so the definitive architecture can be proven in one domain before the others return.

Today, the only active product domain is `Tasks`.

What is real right now:

- a unified frontend in `apps/web`
- a unified backend in `server`
- shared schemas in `packages/shared`
- a stable Tasks HTTP API
- a stable Tasks agent chat endpoint
- provider abstraction for local and hosted LLMs
- conversation history for chat
- live sync between chat actions and task views
- actionable planning and review flows for Tasks

What is intentionally not active right now:

- Wallet, Health, People, Work, and Study in the main navigation
- any claim that those domains are production-ready
- cross-domain orchestration as a live product behavior

This plan reflects the codebase as it exists now, not the original broader aspiration alone.

---

## 2. Product Context

The current product is a daily execution system for personal tasks with an embedded AI assistant.

The product surface today is:

- `/tasks`
  Daily operational center. Capture, execute, replan, clarify, and break down work.
- `/tasks/history`
  Decision-oriented review flow. Carry over, discard, and inspect closure quality.
- `/home`
  Tasks-only command summary.
- shared shell chat
  Domain-aware Tasks assistant with persisted conversations and tool-driven actions.

The main product behaviors already implemented in Tasks are:

- quick capture for today
- completion, carry-over, discard, and delete flows
- planning guidance based on queue pressure and carry-over rate
- clarification gate for vague task capture
- task breakdown studio using notes as executable next steps
- end-of-day review with concrete decisions
- AI chat that can create, update, complete, carry over, discard, inspect, and review tasks
- conversation history and replay in the chat panel
- real-time UI sync after both manual and AI-driven mutations

The product thesis being tested is:

> the assistant should not just CRUD tasks; it should improve execution quality, planning quality, and review quality.

---

## 3. System Vision

The long-term system vision remains:

> VDP is a modular personal operating system where each life domain is represented as a focused module with its own workflows, data, services, and agent capabilities.

That vision is still valid, but the sequence is now explicit:

1. make `Tasks` the canonical reference implementation
2. extract only the reusable primitives that proved necessary
3. restore new domains only after they match the Tasks template
4. add cross-domain orchestration only when multiple domains are truly live

This changes the strategic posture:

- before: broad multi-domain implementation in parallel
- now: single-domain convergence first, expansion second

The system is still meant to become a multi-domain life OS, but the current product and engineering plan are intentionally narrower and more disciplined.

---

## 4. Engineering Strategy

The project architecture is now based on a pragmatic rule:

> one domain must be correct, coherent, and testable before the platform expands.

That means:

- no speculative architecture for dormant domains
- no hidden coupling between modules
- no frontend navigation for modules without a working backend and tests
- no provider lock-in for agent development
- no duplicate contract definitions between frontend and backend

The current reference architecture is the `Tasks` module.

---

## 5. Current Architecture

### 5.1 Monorepo

The repository is a `pnpm` + Turbo monorepo with three active workspace packages:

- `apps/web`
- `server`
- `packages/shared`

### 5.2 Frontend

The frontend is a single Next.js app.

Current reality:

- one shared shell
- one active domain in navigation: `Tasks`
- shared chat panel that adapts to the active domain
- Tasks pages driving the product

Inactive domain pages may still exist in the tree, but they are not part of the active product surface.

### 5.3 Backend

The backend is a modular Fastify application.

Current reality:

- `App` is the HTTP composition root
- `AppRuntime` owns startup/shutdown orchestration and runtime lifecycle concerns
- `Core` constructs shared runtime dependencies and bootstraps active modules
- `ModuleContext` carries: repositories, services, eventBus, agentRegistry, sseBroadcaster, llmTraceService, traceService, agentProvider, embeddingProvider
- `TaskModule` is the only active module
- modules expose controllers through a shared `DomainModule` contract
- controllers mount through `HttpController` and register routes through `RouteRegister`
- shared HTTP error handling and validation exist
- shared SSE chat handling exists with error classification (AgentErrorCode)
- shared response helpers exist
- Langfuse (LLMTraceService) + OpenTelemetry (TraceService) integrated with real + noop implementations
- pgvector embeddings: EmbeddingProvider abstraction (Ollama / NoOp), embed-on-write pipeline, similarity search

### 5.4 Agent Runtime

The agent layer is no longer tied to Anthropic.

Current provider model:

- `AnthropicAgentProvider` / `OllamaAgentProvider` — LLM runtime (agent chat)
- `OllamaEmbeddingProvider` / `NoOpEmbeddingProvider` — embedding runtime (semantic search)
- provider selection via environment variables (`AGENT_PROVIDER`, `EMBEDDING_PROVIDER`)
- the `Tasks` agent tool registry is now composed by tool category instead of one monolithic definition file

This matters operationally because:

- local development can run on Ollama for both chat and embeddings
- product testing is not blocked by paid API access
- the agent runtime can evolve without rewriting domain logic

### 5.5 Shared Contracts

`packages/shared` contains the shared request schema layer.

Current rule:

- shared primitives go in `packages/shared/src/schemas/common.ts`
- domain-specific schemas extend those primitives
- frontend and backend are expected to use the same contract vocabulary

---

## 6. Technology Stack

This section documents the tools actually in use in the repository today.

### 6.1 Languages

- TypeScript across frontend, backend, and shared package
- SQL through PostgreSQL and Drizzle-managed schema definitions
- CSS through global styles and Tailwind CSS 4

### 6.2 Monorepo and Package Management

- `pnpm` for package management and workspace linking
- `Turbo` for workspace task orchestration

### 6.3 Frontend

- `Next.js 15` as the application framework
- `React 19` as the UI runtime
- `Tailwind CSS 4` for utility-based styling
- `@tanstack/react-query` for server-state management and cache synchronization
- `lucide-react` for icons
- `date-fns` for date formatting and manipulation
- `recharts` for charts and trend visualizations

### 6.4 Backend

- `Fastify 5` as the HTTP server
- `@fastify/cors` for CORS handling
- `drizzle-orm` as the database access layer
- `pg` as the PostgreSQL driver
- `node-cron` for scheduler support
- `dotenv` for environment loading
- `crypto-randomuuid` for UUID generation compatibility in parts of the backend

### 6.5 Database and Infrastructure

- `PostgreSQL` with `pgvector` extension as the primary application database
- Docker image: `pgvector/pgvector:pg16` (both dev and test)
- Docker Compose for local infrastructure
- a separate Docker Compose test database on port `5433`
- `task_embeddings` table with `vector(768)` column for semantic similarity search

### 6.6 Shared Contracts and Validation

- `zod` for request validation and shared schema definitions
- shared schema package in `packages/shared`

### 6.7 AI and Agent Runtime

- provider abstraction over the LLM runtime
- `@anthropic-ai/sdk` for Anthropic support
- `Ollama` for local model execution
- current local model baseline: `qwen3:4b`
- SSE for streaming assistant responses to the frontend

### 6.8 Testing and Developer Tooling

- `Vitest` for unit, integration, and e2e tests
- `tsx` for local TypeScript execution and watch mode
- `TypeScript` compiler for builds in `server` and `packages/shared`
- `drizzle-kit` for schema generation, migrations, and DB studio

### 6.9 Runtime and Delivery Model

- single Next.js frontend app
- single Fastify backend app
- modular monolith backend architecture
- local-first AI development through Ollama

### 6.10 Future AI and Integration Stack

The current AI/runtime stack is enough for the present Tasks product,
but it is not enough for the broader VDP vision.

If VDP expands into deeper intelligence, higher trust, and real external actions, 
these are the most likely additions.

#### Observability and Trust

- `Langfuse`
  For prompt tracing, tool-call tracing, agent analytics, and evaluation.
- `OpenTelemetry`
  For backend traces across controllers, services, providers, and integrations.
- `Sentry`
  For frontend and backend error monitoring.
- `Pino`
  For structured application and audit logs if logging needs become more explicit than the default setup.

#### Memory and Retrieval

- `pgvector`
  For embeddings and semantic retrieval inside PostgreSQL.
- PostgreSQL full-text search
  For structured search before adding a separate search system.
- provider or local embedding models
  Likely through Ollama embeddings or a hosted embedding provider later.

#### External Integrations

- `googleapis`
  For Gmail and Google Calendar integration in a future Work module.
- `google-auth-library`
  For OAuth flows and token handling tied to Google integrations.
- `gramjs`
  For user-level Telegram access, contacts, and messaging flows in a future People module.
- `Telegraf`
  Only if a Telegram bot becomes useful. It is not the main candidate for personal contact access.
- `nodemailer`
  For SMTP-based email flows if needed.
- `resend`
  Optional if transactional email delivery becomes part of the platform.

#### Automation and Background Work

- keep `node-cron` for near-term scheduling
- `Trigger.dev`
  Likely candidate if background jobs, retries, and workflow durability become important.
- `Temporal`
  Only if orchestration grows far beyond what the current product needs.

#### Auth and Account Linking

- `Auth.js`
  Candidate if the product moves beyond local single-user assumptions.
- `better-auth`
  Alternative candidate for authentication and account linking depending on future auth needs.

#### Realtime

- keep `SSE` for chat streaming and simple live updates
- `WebSockets`
  Only if richer bidirectional realtime behavior becomes necessary later

#### Recommended Priority Order

If only a few additions are introduced in the next stage, the best sequence is:

1. `Langfuse`
2. `OpenTelemetry`
3. `pgvector`
4. `googleapis`
5. `gramjs`

Those five tools would add the most leverage for:

- better agent trust and observability
- stronger memory and retrieval
- real integrations for People and Work
- a cleaner path from assistant chat to real-world actions

---

## 7. Backend Module Model

The backend module pattern is now explicit.

Each active module should follow:

1. `domain`
   Repository contracts and domain-level definitions.
2. `services`
   Business use cases and orchestration.
3. `infrastructure/db`
   Drizzle-backed implementations.
4. `infrastructure/routes`
   Thin HTTP controllers.
5. `infrastructure/agent`
   Thin AI adapter over the same services.
6. events and subscribers
   Emitted from lifecycle transitions and handled through the shared event bus.

Each module boots through:

1. `registerServices()`
2. `registerEventHandlers()`
3. `registerAgents()`
4. `getControllers()`
5. `getDescriptor()`

This is no longer theoretical. It is how `TaskModule` works now.

---

## 8. Repository Structure

This section describes the repository as it actually exists now.

```text
vdp/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── globals.css
│       │   │   └── (domain)/
│       │   │       ├── layout.tsx
│       │   │       ├── home/page.tsx
│       │   │       ├── tasks/page.tsx
│       │   │       ├── tasks/history/page.tsx
│       │   │       ├── health/page.tsx
│       │   │       └── wallet/page.tsx
│       │   ├── components/
│       │   │   └── shell/
│       │   │       └── chat-panel.tsx
│       │   ├── hooks/
│       │   └── lib/
│       │       ├── api/
│       │       ├── chat/
│       │       ├── tasks/
│       │       ├── navigation.ts
│       │       └── providers.tsx
│       └── package.json
│
├── server/
│   ├── src/
│   │   ├── App.ts
│   │   ├── server.ts
│   │   └── modules/
│   │       ├── Core.ts
│   │       ├── common/
│   │       │   ├── base/
│   │       │   │   ├── agents/
│   │       │   │   ├── db/
│   │       │   │   ├── event-bus/
│   │       │   │   ├── modules/
│   │       │   │   ├── services/
│   │       │   │   └── sse/
│   │       │   ├── http/
│   │       │   └── infrastructure/
│   │       ├── tasks/
│   │       │   ├── domain/
│   │       │   ├── services/
│   │       │   ├── infrastructure/
│   │       │   │   ├── agent/
│   │       │   │   ├── db/
│   │       │   │   └── routes/
│   │       │   └── __tests__/
│   │       ├── wallet/
│   │       └── health/
│   └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── index.ts
│       │   ├── schemas/
│       │   │   ├── common.ts
│       │   │   ├── tasks.ts
│       │   │   ├── wallet.ts
│       │   │   └── health.ts
│       │   └── types/
│       └── package.json
│
├── README.md
├── ARCHITECTURE.md
├── PLAN.md
├── turbo.json
└── pnpm-workspace.yaml
```

Notes:

- `wallet` and `health` remain in the repository as incomplete modules and placeholder frontend pages
- they are not part of the active runtime contract
- `tasks` is the only domain that currently meets the architecture bar

---

## 9. Domain Status

### 8.1 Tasks

Status: `active reference module`

Backend:

- controller layer stable
- shared validation and error handling integrated
- SSE chat route integrated
- conversation persistence integrated
- provider abstraction integrated
- unit, integration, and e2e baseline established

Frontend:

- active navigation
- operational Tasks dashboard
- review page
- home summary
- chat history and action rendering
- live sync between task state and chat-driven mutations

Product maturity:

- good enough to serve as the architecture reference
- still needs polish and product evolution

### 8.2 Wallet

Status: `dormant / not active`

Reality:

- schemas and old code exist
- not aligned with the current module architecture
- not exposed in active navigation
- not part of the supported product surface

### 8.3 Health

Status: `dormant / not active`

Reality:

- schemas and old code exist
- not aligned with the current module architecture
- not exposed in active navigation
- not part of the supported product surface

### 8.4 People / Work / Study

Status: `vision only`

Reality:

- not implemented as active modules
- not eligible for navigation or roadmap activation yet

---

## 10. Product Scope Right Now

The supported scope right now is:

- one user
- one Tasks module
- one shared shell
- one domain-aware AI chat surface

The supported user story is:

> capture work, clarify it, break it down, execute it, review it, and use the assistant to guide those decisions.

The product is not yet:

- a true multi-domain life dashboard
- a cross-domain event intelligence system
- a proactive multi-agent orchestration platform
- a complete personal knowledge graph

Those remain future directions, not present claims.

---

## 11. Current Technical Conventions

### 10.1 Controllers

- controllers implement `registerRoutes(routes: RouteRegister)`
- `HttpController` owns Fastify mounting by prefix
- `App` registers the shared status controller plus module controllers
- controllers declare routes, validate inputs, call services, and respond
- controllers do not own business logic

### 10.2 Errors

The HTTP error contract is:

- `error`
- `message`
- `details`

This is the canonical backend-to-frontend error shape.

### 10.3 Validation

- request validation uses shared `zod` schemas
- shared validation helpers live in the common HTTP layer

### 10.4 Responses

Shared response helpers exist for:

- created resources
- message payloads
- paginated collections
- carry-over summaries
- status responses

### 10.5 Agent Chat

The shared SSE event contract is:

- `text`
- `tool_use`
- `tool_result`
- `done`
- `error`

Tasks chat is available at:

- `POST /api/v1/tasks/agent/chat`

History endpoints:

- `GET /api/v1/tasks/agent/conversations`
- `GET /api/v1/tasks/agent/conversations/:id/messages`

### 10.6 Provider Runtime

Local provider support is part of the intended development model.

Current supported providers:

- Anthropic
- Ollama

Recommended local setup:

- `AGENT_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `AGENT_MODEL=qwen3:4b`
- `EMBEDDING_PROVIDER=ollama`
- `EMBEDDING_MODEL=nomic-embed-text` (default)

---

## 12. Testing Baseline

The current reference quality bar is the Tasks baseline.

Required commands:

```bash
pnpm --filter @vdp/server build
pnpm --filter @vdp/server test:unit
pnpm --filter @vdp/server test:integration
pnpm --filter @vdp/server test:e2e
pnpm --filter @vdp/web build
```

For DB-backed tests:

- test Postgres runs on `localhost:5433`
- use `pnpm --filter @vdp/server db:test:up`

The practical rule is:

> a domain is not active until it satisfies the same baseline Tasks satisfies now.

---

## 13. What Was Completed Recently

The following work is already done and should not be treated as future work anymore:

- Tasks-only stabilization
- frontend contract cleanup for Tasks
- shared validation helpers
- shared HTTP error handling
- shared response helpers
- shared controller contract
- shared module lifecycle
- module descriptors
- shared event subscriber pattern
- provider abstraction for agent runtime
- Ollama support
- Tasks chat endpoint
- Tasks conversation history
- chat action rendering
- manual/chat mutation sync
- actionable review flow
- daily planning guidance
- clarification flow for vague tasks
- breakdown studio for tasks
- multiple UI polish passes on the Tasks dashboard
- Phase 1 complete (2026-03-22): contract integrity, Langfuse, OpenTelemetry, task detail, chat guidance, compact dual layout, shared badge components, trust & auditability (mutation summaries, conversation continuity, error classification)
- Phase 2 foundation complete (2026-03-22): pgvector (pgvector/pgvector:pg16), EmbeddingProvider abstraction (Ollama nomic-embed-text + NoOp), TaskEmbeddingRepository (Drizzle + Fake), EmbedTask service (embed-on-write from CreateTask/UpdateTask/AddTaskNote), FindSimilarTasks service
- Server architecture refactor pass complete enough to pause (2026-03-23): modular Core composition, runtime lifecycle split (`App` / `AppRuntime`), logging abstraction through shared infrastructure, `TaskModuleRuntime`, slimmer event/insight layer, smaller `BaseAgent` collaborators, and OO controller registration through `HttpController` + `RouteRegister`
- Task agent tool registry cleanup complete (2026-03-23): `TasksTools` split into category-based builders with shared tool helpers and registry coverage tests

---

## 14. Immediate Product Priorities

The next work should improve `Tasks` as a product, not re-open broad architecture work without 
pressure from real needs.

The server is now in a good enough architectural state to stop refactoring unless a concrete product change exposes a new hotspot.

Current priority stack:

1. refine the Tasks product experience
2. strengthen AI guidance inside real workflows
3. stabilize usability and trust
4. only then evaluate whether a second domain is worth reintroducing

### Recommended near-term product themes

#### A. Chat quality and decision quality

- improve how the agent clarifies vague requests
- improve how the agent proposes breakdowns
- improve review recommendations and next-step suggestions
- make assistant responses feel more intentional and less tool-log-like

#### B. Task detail and continuity

- expose richer task detail around notes, breakdown, and history
- make breakdown steps easier to inspect and act on
- improve continuity between `/tasks`, `/tasks/history`, and chat conversations

#### C. Daily execution UX

- continue polish on the operational screen
- strengthen visual hierarchy for focus vs backlog vs blocked work
- improve mobile behavior and compact desktop states

#### D. Product intelligence

- stronger planning signals
- better stuck-task detection
- more explicit overload guidance
- better review summaries across time windows

---

## 15. Reintroduction Rules For Other Domains

Wallet, Health, or any future domain should only return when all of the following are true:

1. shared schemas exist in `packages/shared`
2. the module follows the current backend module shape
3. controller validation uses shared helpers
4. errors use the shared HTTP contract
5. response shape is stable and shared with the frontend
6. the module exposes controllers through the module contract
7. agent chat exists if the domain needs AI interaction
8. unit, integration, and e2e tests are green
9. the frontend page uses the canonical client patterns
10. navigation is only enabled after the above is complete

This is a hard gate, not a soft suggestion.

---

## 16. Implementation Roadmap

This roadmap is ordered by actual leverage, not by original ambition.

29 concrete tasks across Phases 1 and 2.

### Phase 0. Completed

- stabilize the repo around Tasks
- establish the reference architecture
- turn Tasks into a usable product slice

### Phase 1. ✅ Completed (2026-03-22)

All 18 tasks delivered:

#### 0.9 — Contract & State Integrity ✅

1. `0.9.1` ✅ Lifecycle integrity for Tasks
2. `0.9.2` ✅ Carry-over contract alignment

#### 1.0 — Langfuse Integration ✅

3. `1.0.1` ✅ LLMTraceService — shared instance via Core → ModuleContext, real + no-op implementations
4. `1.0.2` ✅ Instrument BaseAgent — trace every chat(), generation(), and tool execution
5. `1.0.3` ✅ Prompt version tracking — SHA-256 hash in Langfuse generation metadata

#### 1.1 — OpenTelemetry Integration ✅

6. `1.1.1` ✅ TraceService — OTel SDK + auto-instrumentations, OTLP exporter, real + no-op
7. `1.1.2` ✅ Custom spans for agent provider calls

#### 1.2 — Task Detail Experience ✅

8. `1.2.1` ✅ Task notes endpoint
9. `1.2.2` ✅ Frontend task detail panel — slide-over with notes, breakdown, carry-over count
10. `1.2.3` ✅ Note types for breakdown legibility — type column: note/breakdown_step/blocker

#### 1.3 — Chat Guidance Quality ✅

11. `1.3.1` ✅ Better clarification prompts
12. `1.3.2` ✅ Better review prompts
13. `1.3.3` ✅ Better breakdown suggestions

#### 1.4 — UI Polish ✅

14. `1.4.1` ✅ Compact task layout — dual desktop rows (hidden md:flex) / mobile cards (flex md:hidden), inline badges, icon-only action buttons
15. `1.4.2` ✅ Mobile actions — expandable inline pattern via "..." toggle (covered by 1.4.1)
16. `1.4.3` ✅ Visual consistency pass — shared TaskPriorityBadge + TaskDomainBadge components

#### 1.5 — Trust & Auditability ✅

17. `1.5.1` ✅ Richer mutation summaries — priority tag, carry-over count warnings, date context in Spanish
18. `1.5.2` ✅ Conversation continuity — resume indicator with title + time ago
19. `1.5.3` ✅ Error feedback — AgentErrorCode classification + Spanish user-facing messages

### Phase 2. Product intelligence for Tasks

Goal:

make the system coach better decisions, not just execute commands

Infrastructure addition: **pgvector** for semantic search over task history.

Note:

- the March 23 server architecture refactor pass is intentionally out of this roadmap now
- treat it as complete enough for the current stage
- do not add more server-cleanup tasks unless product work reveals a real constraint

#### 2.0 — pgvector Infrastructure ✅ (2026-03-22)

20. `2.0.1` ✅ Enable pgvector + embeddings table — Docker switched to pgvector/pgvector:pg16, task_embeddings table with vector(768), test DB updated
21. `2.0.2` ✅ EmbeddingProvider abstraction — abstract class, OllamaEmbeddingProvider (nomic-embed-text), NoOpEmbeddingProvider, createEmbeddingProvider factory, wired through ModuleContext
22. `2.0.3` ✅ TaskEmbeddingRepository + embed-on-write — Drizzle + Fake implementations, EmbedTask service, fire-and-forget from CreateTask/UpdateTask/AddTaskNote, FindSimilarTasks service registered

#### 2.1 — Similarity & Repeat Detection (next)

23. `2.1.1` FindSimilarTasks agent tool — expose find_similar_tasks in TaskAgent tool definitions (service already exists and works)
24. `2.1.2` Duplicate detection on create — agent should check similarity before creating tasks, warn user if similar task exists
25. `2.1.3` Automatic repeat detection on carry-over — DetectRepeatPattern + TaskRepeatDetected event

#### 2.2 — Richer Planning Signals

26. `2.2.1` Planning context service — aggregates stats + carry-over rate + stuck tasks + insights in one tool call

#### 2.3 — Better Overload Heuristics

27. `2.3.1` Historical overload detection — 7-day average completion × 1.5 threshold, lower if carry-over rate > 40%

#### 2.4 — Better Trend Summaries

28. `2.4.1` Weekly summary service — created/completed/carried/discarded, trend direction, best day, worst domain

#### 2.5 — Stronger End-of-Day Recommendations

29. `2.5.1` Recommendation engine — typed recommendations (discard/break_down/reschedule/celebrate) with reasons

### Phase 3. Decide on second domain readiness

Goal:

choose whether Wallet or Health deserves to be the second module brought up to the Tasks bar

Decision criteria:

- user need is real
- scope is small enough to finish
- module can conform to the reference architecture
- the product benefit is clear

This phase should start with one explicit decision:

- `Wallet next`
- `Health next`
- or `stay on Tasks longer`

### Phase 4. Reintroduce one new domain

Goal:

restore exactly one additional domain with the full Tasks template

Required outcome:

- real backend module
- real frontend contract
- real tests
- real navigation activation

### Phase 5. Multi-domain orchestration

Goal:

only after multiple domains are genuinely active, begin cross-domain orchestration

Examples:

- sleep affecting workload recommendations
- spending pressure affecting task prioritization
- study/work/health interactions

This phase is intentionally deferred.

---

## 17. Working Rule Going Forward

The governing rule for the project is now:

> build the future system by making one domain truly correct at a time.

For the current stage, that means:

> Tasks is the product, the architecture reference, and the quality bar.
