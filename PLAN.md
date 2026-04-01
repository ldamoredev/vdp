# VDP Plan

Updated: 2026-04-01

## 1. Purpose

VDP is a modular personal AI operating system.

The long-term vision is still multi-domain:

- Tasks
- Wallet
- Health
- People
- Work
- Study

The current execution strategy is narrower and explicit:

1. keep `Tasks` as the canonical reference module
2. expand carefully into `Wallet` as the second real domain
3. keep the other domains inactive until they match the same backend + frontend + test standard
4. only introduce cross-domain orchestration after at least two domains are truly live

This document reflects the current repository and the latest project memory from 2026-03-26 and 2026-03-27. If other docs conflict, trust this file, the current codebase, and `README.md`.

---

## 2. Current Project State

### 2.1 Stable product surface

`Tasks` is the only domain that is clearly implemented end-to-end and already documented as deployed.

Confirmed current Tasks surface:

- `/tasks`
- `/tasks/history`
- `/home`
- shared shell chat for Tasks
- `/login`

Confirmed Tasks capabilities:

- stable HTTP API
- stable agent chat endpoint
- persisted chat conversations
- live sync between chat mutations and UI
- clarification gate for vague capture
- planning and review flows
- embeddings architecture and similarity search
- event-driven task insights

### 2.2 In-progress expansion

`Wallet` is no longer just an idea in the repo. The current worktree shows active Wallet implementation in both backend and frontend:

- `WalletModule` exists and is registered in `DefaultCoreConfiguration`
- Wallet routes and Wallet agent routes exist on the backend
- Wallet pages are enabled in frontend navigation
- the landing page currently marks Wallet as `Activo`
- Wallet schema and migrations are present in the current worktree

However, Wallet is not yet at the same confidence level as Tasks. It should be treated as `in progress`, not as fully shipped.

### 2.3 Inactive domains

These domains remain inactive from a product and runtime-trust perspective:

- `Health`
- `People`
- `Work`
- `Study`

Current status:

- Health still has placeholder/demo frontend presence
- People, Work, and Study still exist mainly as demo UI or inactive pages
- none of them should be treated as live product modules

---

## 3. Domain Status Matrix

| Domain | Backend | Frontend | Agent | Tests | Status |
|--------|---------|----------|-------|-------|--------|
| Tasks | Implemented | Implemented | Implemented | Backend strong, frontend selectors only | Stable |
| Wallet | Implemented | Implemented | Implemented (15 tools) | Backend good (~55 tests), frontend ~3% | In progress |
| Health | Not active | Placeholder/demo | Not active | N/A | Inactive |
| People | Not active | Demo/inactive | Not active | N/A | Inactive |
| Work | Not active | Demo/inactive | Not active | N/A | Inactive |
| Study | Not active | Demo/inactive | Not active | N/A | Inactive |

Important nuance:

- `Tasks` is the only domain that is clearly complete enough to be called the current product
- `Wallet` backend is more complete than previously assessed (full route surface, all services, 15 agent tools) — the gap is frontend test coverage and type alignment

---

## 4. Architecture Snapshot

### 4.1 Monorepo

The workspace currently contains three active packages:

- `apps/web`
- `server`
- `packages/shared`

There are no separate live frontend packages for Wallet, Health, People, Work, or Study in the current workspace. Older references to those packages are stale.

### 4.2 Frontend

Frontend stack:

- Next.js 15
- React 19
- Tailwind CSS 4
- React Query

Current frontend architecture decisions:

- one shared app shell
- domain-aware navigation and chat shell
- `Tasks` uses the split-context presentation pattern
- `TasksProvider` owns dashboard state composition
- `HistoryProvider` owns review page state composition

Tasks presentation remains the reference frontend pattern for future domains.

### 4.3 Backend

Backend stack:

- Fastify 5
- Drizzle ORM
- PostgreSQL
- pgvector

Current backend architecture decisions:

- modular monolith
- `Core` builds shared runtime dependencies once
- modules receive dependencies through `ModuleContext`
- no singletons
- shared HTTP controller pattern
- shared error handling
- shared SSE/agent chat handling

Module lifecycle remains:

1. `registerServices()`
2. `registerEventHandlers()`
3. `registerAgents()`
4. `getControllers()`
5. `getDescriptor()`

### 4.4 Shared contracts

`packages/shared` is the common contract layer:

- shared zod schemas
- shared request/response vocabulary
- domain schemas for Tasks and future domains

Frontend and backend are expected to align through this package.

### 4.5 AI and runtime providers

The provider abstraction is established and should remain:

- LLM provider abstraction for chat
- embedding provider abstraction for semantic search
- local development via Ollama
- hosted runtime via OpenAI-compatible provider in production

### 4.6 Operational rules already established

These are current architecture rules, not optional ideas:

- never use singleton patterns for shared services
- never use `toISOString().slice(0, 10)` for local-date logic
- use project date helpers for local dates
- SSE endpoints using `reply.hijack()` must set CORS headers manually

---

## 5. Verified Progress

### 5.1 Tasks

The Tasks module remains the strongest part of the system and the reference implementation.

Confirmed in code and memory:

- split-context frontend refactor is complete
- planning, review, and chat flows are implemented
- repeat-detection flow exists in code
- `TaskRepeatDetected` event handling exists in code
- `get_recommendations` agent tool exists in code
- auth gate via `ACCESS_SECRET` exists in frontend and backend
- OpenAI-compatible provider support exists in code

### 5.2 Recent Tasks polish from 2026-03-27 session memory

The latest Claude session log shows additional Tasks work completed on 2026-03-27:

- carry-over badge component
- improved empty state for the execution queue
- staggered task-list transitions
- quick-capture modal with keyboard shortcut

### 5.3 Verification captured in latest session memory

The latest session memory also records successful verification on 2026-03-27:

- server build passed
- server unit tests passed: `143` tests
- web build passed
- shared package tests passed: `76` tests

These numbers are newer than several older docs and should be considered the more current reference.

### 5.5 Test coverage audit (2026-04-01)

A full coverage audit was performed against all uncommitted changes. Key findings:

**Backend Wallet — well-tested:**
- `wallet-services.test.ts`: ~36 unit test cases covering all 22 services
- `DrizzleWalletRepositories.test.ts`: 6 integration describes (real Postgres)
- `WalletAPI.e2e.test.ts`: 11+ e2e cases via `app.inject()`
- `WalletAgentBehavior.test.ts`: 3 behavioral flows (savings, investments, exchange rates)
- `WalletTools.test.ts`: 1 tool registry composition test

**Backend Wallet — untested:**
- `WalletEventHandlers` (event listener wiring) — no tests
- `DetectSpendingSpike` (spike detection algorithm) — no tests
- Agent error scenarios (malformed tool inputs, service failures) — not covered

**Frontend Wallet — critical gap:**
- 31 files, only 1 tested (`wallet-selectors.test.ts`, 4 test cases)
- 0 hook tests, 0 component tests, 0 context tests, 0 API client tests
- Estimated coverage: ~3%

**Frontend Tasks refactor — critical gap:**
- 25 files modified/new, 0 new tests added
- 1 existing test file (`tasks-dashboard-selectors.test.ts`, ~30 test cases) covers selectors only
- All hooks, contexts, and components: untested
- `chat-sync.ts` (cache invalidation logic) is high-risk and untested

**Frontend shared/primitives:**
- `use-required-context.ts`, `query-keys.ts`, 3 primitive components: all untested

**Verdict:** Backend follows the Tasks testing standard. Frontend does not. The project cannot claim 80% coverage on the frontend layer of either domain.

### 5.4 Wallet work currently visible in the repo

Current Wallet work in the repo includes:

- backend module class and runtime
- domain entities and repositories
- Drizzle repositories
- fake repositories
- REST controller
- Wallet agent controller
- Wallet agent tools
- Wallet event handling for spending spikes
- frontend dashboard and transaction pages
- frontend stats, savings, and investments pages

This is meaningful progress, but it is still not a proven vertical slice.

---

## 6. Current Reality of Wallet

Wallet should be described precisely.

### 6.1 What is implemented (verified 2026-04-01)

Backend:
- 22 services across 6 sub-domains (accounts, categories, transactions, stats, savings, investments, exchange rates)
- 6 repository interfaces with Drizzle + Fake implementations
- 15 agent tools across 6 tool files
- Full HTTP controller with all CRUD + stats + agent chat routes
- Event system (`TransactionCreated`, `SpendingSpike`)
- Shared zod schemas in `@vdp/shared`

Frontend pages:
- `/wallet` (dashboard)
- `/wallet/transactions`, `/wallet/transactions/new`
- `/wallet/stats`
- `/wallet/savings`
- `/wallet/investments`
- `/wallet/accounts`
- `/wallet/categories`

### 6.2 Contract alignment (corrected 2026-04-01)

The previous version of this section was **factually wrong**. A code audit on 2026-04-01 confirmed the backend exposes the full wallet surface:

**Backend HTTP routes (all under `/api/v1/wallet`):**
- Accounts: GET, POST, PUT /:id, DELETE /:id
- Categories: GET (?type=), POST
- Transactions: GET (?filters), POST, PUT /:id, DELETE /:id
- Stats: GET /summary, GET /by-category, GET /monthly-trend
- Savings: GET, POST, PUT /:id, POST /:id/contribute
- Investments: GET, POST, PUT /:id
- Exchange rates: GET /latest, POST
- Agent: GET /conversations, GET /conversations/:id/messages, POST /chat

**Frontend API client calls match all of these routes.**

The route-level contract mismatch previously described does not exist.

**What is still inconsistent:**

1. **Frontend types are duplicated.** `apps/web/src/lib/api/types.ts` defines wallet types locally instead of importing from `@vdp/shared`. The shapes match, but they can drift.
2. **Some mutations are not exposed.** The frontend has no mutation hooks for: `updateTransaction`, `updateSavingsGoal`, `deleteAccount`, or full `updateAccount` (only rename is exposed).
3. **Frontend test coverage is ~3%.** The backend meets the Tasks testing standard; the frontend does not.

### 6.3 Product status decision

Wallet's backend is more complete than previously assessed. The remaining gap is:

- frontend test coverage is far below the Tasks standard
- frontend types should import from `@vdp/shared` instead of duplicating
- 2 backend services (`WalletEventHandlers`, `DetectSpendingSpike`) lack tests
- some frontend mutation hooks are missing for operations the backend supports

---

## 7. Risks and Unknowns

### 7.1 Stale documentation

Several docs are older than the current code and should not be treated as current truth by themselves:

- `docs/PRODUCT.md` is still vision-heavy
- `.claude/launch.json` references packages that do not exist in the current workspace
- older review docs contain outdated test counts and outdated gap lists

### 7.2 Dirty worktree

The current repository has many uncommitted changes, including:

- Wallet backend work
- Wallet frontend work
- docs moved under `docs/`
- recent Tasks UI updates

That means the current state is a mix of:

- already-proven Tasks behavior
- ongoing Wallet implementation
- documentation cleanup

### 7.3 Frontend test coverage debt

This is the clearest current risk:

- Backend wallet is well-tested (~36 service tests, 6 integration, 11+ e2e)
- Frontend wallet has ~3% coverage (1 test file out of 31 source files)
- Frontend tasks refactor has 0 new tests for 25 modified/new files
- `chat-sync.ts` (cache invalidation for all task mutations) is completely untested
- Frontend hooks with complex logic (mutations, cache sync, form transformations) are untested

This means bugs in the frontend data layer will only surface in production.

### 7.4 Date-rule status (verified 2026-04-01)

The `investments/page.tsx` violation previously reported here does **not exist** in the current code. Verified by grep.

Remaining `toISOString()` uses are in:
- `work/page.tsx` (inactive domain, Google Calendar formatting — acceptable UTC use)
- `server/src/App.ts` line 54 (event logging timestamp — legitimate UTC use)
- `server/src/modules/common/http/responses.ts` line 67 (HTTP response timestamp — legitimate UTC use)

No `.slice(0, 10)` violations found. Date rule is currently clean.

### 7.5 Duplicated frontend types

`apps/web/src/lib/api/types.ts` defines all wallet types locally instead of importing from `@vdp/shared/types/wallet`. The shapes currently match, but they can drift silently. This should be resolved before Wallet is considered stable.

### 7.6 Untested backend services

Two wallet services have zero test coverage:
- `WalletEventHandlers` — if broken, domain events (e.g., spending spike detection) silently fail
- `DetectSpendingSpike` — business logic algorithm with no validation

### 7.7 Missing frontend mutation hooks

The backend supports operations the frontend doesn't expose:
- `updateTransaction` — no mutation hook
- `updateSavingsGoal` — no mutation hook
- `deleteAccount` — no mutation hook
- Full `updateAccount` — only rename is exposed

---

## 8. Delivery Strategy From Here

The project should continue with a disciplined sequence.

### 8.1 Immediate priority

Stabilize the current repo around:

1. proven `Tasks`
2. one coherent `Wallet` MVP slice

### 8.2 Definition of a real Wallet MVP

Wallet should only be considered active when it has:

1. ~~aligned frontend and backend contracts~~ ✅ (verified 2026-04-01 — routes match)
2. ~~shared schemas in `packages/shared`~~ ✅ (server imports from `@vdp/shared`)
3. ~~thin HTTP routes over services~~ ✅ (WalletController delegates to services)
4. ~~agent tools over the same services~~ ✅ (15 tools across 6 tool files)
5. tests following the Tasks template — **partially done** (backend yes, frontend no)
6. ~~no obvious broken routes in navigation~~ ✅ (all pages render, all API calls have matching backend routes)
7. frontend types imported from `@vdp/shared` instead of duplicated — **not done**
8. `WalletEventHandlers` and `DetectSpendingSpike` tested — **not done**
9. frontend hook/mutation tests at reasonable coverage — **not done (~3%)**

### 8.3 Cross-domain sequencing

Cross-domain behavior should begin only after Wallet is truly working.

The first meaningful cross-domain proof should be:

- Wallet emits spending-related events
- Tasks consumes that signal in a useful, concrete way

### 8.4 What should stay inactive

Until Wallet is real, do not treat these as active roadmap execution targets:

- Health
- People
- Work
- Study

They can remain as design references or dormant code, but not as active product claims.

---

## 9. Working Plan

### Phase A — Close the test coverage gap (current priority)

The backend is ahead of the frontend. Before adding features, close the coverage debt:

**Must-have before commit (blocks merge):**

| # | Test | Type | Risk if skipped |
|---|------|------|-----------------|
| 1 | `WalletEventHandlers.test.ts` | Unit | Silent event failures |
| 2 | `DetectSpendingSpike.test.ts` | Unit | Untested business logic |
| 3 | `chat-sync.test.ts` | Unit | Stale UI across all task mutations |
| 4 | `use-wallet-creation.test.ts` | Unit | Form→API payload corruption |
| 5 | `use-wallet-transaction-creation.test.ts` | Unit | Category filtering + tag parsing bugs |

**Should-have (commit with tracked debt):**

| # | Test | Type | Risk if skipped |
|---|------|------|-----------------|
| 6 | `use-tasks-queries.test.ts` | Unit | Data transformation bugs |
| 7 | `use-task-mutations.test.ts` | Unit | Concurrent mutation tracking |
| 8 | `use-history-model.test.ts` | Unit | Date navigation (known risk area) |
| 9 | `use-wallet-queries.test.ts` | Unit | Scope-conditional loading |
| 10 | `use-wallet-mutations.test.ts` | Unit | Cache invalidation |
| 11 | `client.test.ts` | Unit | API client error handling |

**Testing strategy:**
- Unit tests for hooks: mock `useQuery`/`useMutation`, test data flow
- Unit tests for services: Fake repos (established pattern)
- No Playwright/browser E2E yet — premature without unit foundation
- Revisit browser E2E when frontend unit coverage reaches >60%

### Phase B — Align frontend types with shared package

- Replace `apps/web/src/lib/api/types.ts` wallet types with imports from `@vdp/shared`
- This eliminates the type drift risk (section 7.5)

### Phase C — Complete Wallet mutation surface

- Add missing mutation hooks: `updateTransaction`, `updateSavingsGoal`, `deleteAccount`, full `updateAccount`
- These backend endpoints already exist; the frontend just doesn't expose them

### Phase D — Keep Tasks authoritative

- preserve Tasks as the reference module
- keep Tasks architecture, contracts, and tests as the baseline
- avoid diluting the product narrative back into six active modules

### Phase E — Prove the first cross-domain signal

- wire one concrete Wallet-to-Tasks interaction
- keep it narrow and testable
- avoid building a general orchestration engine too early

### Phase F — Reassess further domains

Only after Tasks + Wallet are both real:

- decide whether Health, People, Work, or Study is the third domain
- restore a domain only when it matches the shared module template

---

## 10. Source-of-Truth Notes

When reconstructing project state in future sessions:

- trust the current codebase first
- trust `README.md` and this `PLAN.md` second
- use Claude memory summaries as historical context
- treat `docs/PRODUCT.md` as vision, not current scope
- treat older review docs as useful but not automatically current

Current concise summary:

- `Tasks` is real and stable
- `Wallet` backend is fully implemented; frontend is implemented but undertested (~3%)
- the rest are inactive
- the architecture is sound
- the current challenge is test coverage, not features — close the frontend gap before adding more
