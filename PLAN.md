# VDP Plan

Updated: 2026-04-03

Status note:

- For current repository state verified directly from code on 2026-04-03, trust [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) first.
- Use this file primarily as roadmap and execution guidance.
- Authentication V1 is now implemented. The immediate platform priority is auth hardening and multi-user verification before starting another domain module.

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
| Wallet | Implemented | Implemented | Implemented (15 tools) | Backend verified, frontend baseline improved (30 tests) | Active, newer than Tasks |
| Health | Not active | Placeholder/demo | Not active | N/A | Inactive |
| People | Not active | Demo/inactive | Not active | N/A | Inactive |
| Work | Not active | Demo/inactive | Not active | N/A | Inactive |
| Study | Not active | Demo/inactive | Not active | N/A | Inactive |

Important nuance:

- `Tasks` is the only domain that is clearly complete enough to be called the current product
- `Wallet` backend is more complete than previously assessed (full route surface, all services, 15 agent tools)
- several older documented Wallet gaps are now closed in code and tests

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
- OpenAI-compatible provider support exists in code

### 5.2 Authentication V1 completed (verified 2026-04-03)

The first multi-user auth slice is now implemented in the repo.

Completed platform changes:

- real `core.users`, `core.sessions`, and `core.audit_logs`
- session-based auth with `httpOnly` `vdp_session` cookie
- real login, register, logout, and current-user flow
- backend request auth context on Fastify request lifecycle
- per-user ownership across Tasks, Wallet, and agent conversations
- same-origin auth/proxy flow in the web app
- removal of the previous `ACCESS_SECRET` browser login flow
- cleaned migration history with one active baseline migration

Product/UX changes:

- auth model is plain users only for now; there is no admin role
- login and register are both available from the same access screen
- the web app now bootstraps auth through `/api/auth/me`

Validation completed in this auth slice:

- server TypeScript passed
- web TypeScript passed
- server unit tests passed: `175/175`
- web tests passed: `114/114`
- server e2e passed: `31/31`
- production builds passed

### 5.3 Recent Tasks polish from 2026-03-27 session memory

The latest Claude session log shows additional Tasks work completed on 2026-03-27:

- carry-over badge component
- improved empty state for the execution queue
- staggered task-list transitions
- quick-capture modal with keyboard shortcut

### 5.4 Verification captured in latest session memory

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

**Backend Wallet — current verified state:**
- `WalletEventHandlers.test.ts` exists
- `DetectSpendingSpike.test.ts` exists
- `wallet-services.test.ts`, `DrizzleWalletRepositories.test.ts`, `WalletAPI.e2e.test.ts`, `WalletAgentBehavior.test.ts`, and `WalletTools.test.ts` exist
- Agent error scenarios are still less explicit than the happy-path/service coverage and should be treated as a smaller residual gap, not a missing test surface

**Frontend Wallet — current verified state:**
- `wallet-selectors.test.ts` exists
- `wallet-creation-logic.test.ts` exists
- `wallet-transaction-creation-logic.test.ts` exists
- current wallet frontend test count is 30 tests across 3 files
- this is no longer the previous `~3% / 1 file` state, though it is still lighter than the Tasks reference standard

**Frontend Tasks refactor — historical gap, now partially closed:**
- the original refactor landed with little direct coverage
- current validated coverage now includes `tasks-dashboard-selectors.test.ts`, `history-selectors.test.ts`, and `chat-sync.test.ts`
- `chat-sync.ts` is no longer untested
- hook/context/component coverage is still lighter than a fully hardened UI layer

**Frontend shared/primitives:**
- `use-required-context.ts`, `query-keys.ts`, 3 primitive components: all untested

**Verdict:** Wallet is no longer missing the major backend tests and mutation surface previously reported here. Frontend coverage improved materially, but it is still not yet equivalent to the overall confidence level of the Tasks module.

### 5.5 Wallet work currently visible in the repo

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

This is meaningful progress and now constitutes a real vertical slice, even if it still has less overall confidence than the older `Tasks` module.

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

1. **Frontend response interfaces remain local by design.** Union types are now imported from `@vdp/shared`, but API response interfaces in `apps/web/src/lib/api/types.ts` still live in the web app because they intentionally differ from server/domain types (`string` dates vs `Date`, optional enriched fields).
2. **Frontend coverage is still lighter than Tasks.** The older `~3% / one file` claim is stale, but Wallet frontend tests still focus on selectors and creation logic rather than full hook/component coverage.

### 6.3 Product status decision

Wallet's backend and frontend surface are more complete than previously assessed. The previously documented gaps around missing mutation hooks and missing backend event-handler tests are closed. The remaining difference vs `Tasks` is mainly confidence level, long-term hardening, and broader frontend coverage depth.

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

This is the clearest current historical risk area, but parts of it are now stale:

- Backend wallet is well-tested (~36 service tests, 6 integration, 11+ e2e)
- Frontend wallet no longer has only one test file; it currently has 30 tests across 3 frontend test files
- Frontend tasks refactor is no longer in the original zero-test state
- `chat-sync.ts` (cache invalidation for all task mutations) now has dedicated tests
- Frontend hooks with complex logic (mutations, cache sync, form transformations) are untested

This still means frontend data-layer bugs are a meaningful risk, but the Wallet-specific statement above should no longer be read as `~3% coverage with one test file`.

### 7.4 Date-rule status (verified 2026-04-01)

The `investments/page.tsx` violation previously reported here does **not exist** in the current code. Verified by grep.

Remaining `toISOString()` uses are in:
- `work/page.tsx` (inactive domain, Google Calendar formatting — acceptable UTC use)
- `server/src/App.ts` line 54 (event logging timestamp — legitimate UTC use)
- `server/src/modules/common/http/responses.ts` line 67 (HTTP response timestamp — legitimate UTC use)

No `.slice(0, 10)` violations found. Date rule is currently clean.

### 7.5 Frontend type boundary

This section is partially stale.

Current status:

- wallet union types are imported from `@vdp/shared`
- wallet frontend response interfaces remain local in `apps/web/src/lib/api/types.ts`

This is now a boundary decision more than a pure duplication bug. It is acceptable if kept intentional and documented, because frontend response shapes differ from backend/domain types.

### 7.6 Wallet event-service test status

This section is stale.

Current status:

- `WalletEventHandlers.test.ts` exists
- `DetectSpendingSpike.test.ts` exists

These services are no longer untested.

### 7.7 Wallet mutation surface

This section is stale.

Current status:

- `updateTransaction` exists
- `updateSavingsGoal` exists
- `deleteAccount` exists
- full `updateAccount` exists

---

## 8. Delivery Strategy From Here

The project should continue with a disciplined sequence.

### 8.1 Immediate priority

Stabilize the current repo around:

1. replace the current shared-secret gate with real multi-user authentication
2. add user ownership and actor attribution across `Tasks`, `Wallet`, and agent conversations
3. keep `Tasks` authoritative during the auth transition
4. preserve `Wallet` as the second active domain while making it user-scoped

Authentication now comes before any new domain expansion.

### 8.2 Definition of a real Wallet MVP

Wallet should only be considered active when it has:

1. ~~aligned frontend and backend contracts~~ ✅ (verified 2026-04-01 — routes match)
2. ~~shared schemas in `packages/shared`~~ ✅ (server imports from `@vdp/shared`)
3. ~~thin HTTP routes over services~~ ✅ (WalletController delegates to services)
4. ~~agent tools over the same services~~ ✅ (15 tools across 6 tool files)
5. tests following the Tasks template — **partially done** (backend yes, frontend no)
6. ~~no obvious broken routes in navigation~~ ✅ (all pages render, all API calls have matching backend routes)
7. union types imported from `@vdp/shared` while frontend response interfaces remain local by design — **partially done / acceptable current boundary**
8. `WalletEventHandlers` and `DetectSpendingSpike` tested — ✅
9. frontend hook/mutation tests at reasonable coverage — **partially done; older `~3%` claim is stale**

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

### Phase A — Close the test coverage gap ✅

All must-have tests written and committed. Should-have items 8 and 11 also closed in Phase D.

| # | Test | Status |
|---|------|--------|
| 1 | `WalletEventHandlers.test.ts` | ✅ |
| 2 | `DetectSpendingSpike.test.ts` | ✅ |
| 3 | `chat-sync.test.ts` | ✅ 17 tests |
| 4 | `wallet-creation-logic.test.ts` | ✅ 11 tests |
| 5 | `wallet-transaction-creation-logic.test.ts` | ✅ 15 tests |
| 6 | `use-tasks-queries.test.ts` | Deferred — hook logic already covered by `tasks-dashboard-selectors.test.ts` (44 tests) |
| 7 | `use-task-mutations.test.ts` | Deferred — `isTaskBusy` is trivial boolean; cache sync covered by chat-sync tests |
| 8 | `history-selectors.test.ts` | ✅ 12 tests (getReviewSignals + getSignalToneClasses) |
| 9 | `use-wallet-queries.test.ts` | Deferred — scope-conditional loading, low risk |
| 10 | `use-wallet-mutations.test.ts` | Deferred — cache invalidation is single-line `invalidateQueries` |
| 11 | `client.test.ts` | ✅ 11 tests (withQueryParams + ApiError) |

**Current frontend test count: 114 tests across 7 files.**

### Phase B — Align frontend types with shared package ✅

- Union types (`Currency`, `AccountType`, `TransactionType`, `CategoryType`, `InvestmentType`, `ExchangeRateType`) imported from `@vdp/shared`
- Frontend interfaces kept separate (string dates vs Date objects)

### Phase C — Complete Wallet mutation surface ✅

- Added `deleteAccount`, `updateTransaction`, `updateSavingsGoal`, full `updateAccount`
- Wired through context + added delete button to accounts screen

### Phase D — Keep Tasks authoritative ✅

- Tasks remains the reference module with 44 dashboard selector tests + 12 history selector tests + 17 chat-sync tests = 73 task-related frontend tests
- Server side: 85+ task test cases across 27 files
- History selectors and API client utility tests added to strengthen the baseline
- Monorepo test commands (`pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`) and conventional commit hook installed

### Phase E — Prove the first cross-domain signal ✅

Spending spike → automatic task creation. When `DetectSpendingSpike` emits `wallet.spending.spike`,
`CrossDomainEventHandlers` now:
1. Creates an insight (existing behavior)
2. Creates a task "Revisar gasto semanal: subió X%" with domain `finanzas`, priority 3, scheduled today

Implementation:
- `CrossDomainEventHandlers` receives `CreateTask` via dependency injection
- Task creation is fire-and-forget (errors logged, never block the event bus)
- Insight creation happens before task creation (always succeeds even if DB is down)
- 6 tests: insight creation, task creation with correct fields, description details, error resilience, insight-on-failure, unrelated event rejection
- Wired in `TaskModuleRuntime.subscribeToTaskEvents()`

### Phase F — Reassess further domains

Only after Tasks + Wallet are both real:

- decide whether Health, People, Work, or Study is the third domain
- restore a domain only when it matches the shared module template

---

## 10. Authentication Status and Next Slice

This project is no longer only for personal use. The old `ACCESS_SECRET` mechanism has now been replaced in the active codebase.

The remaining auth work is no longer the initial cutover. It is hardening, verification, and user-lifecycle follow-through.

### 10.1 What is now done

Completed in the repo:

- `User` model exists
- session model exists
- audit log foundation exists
- frontend login/register use session auth
- backend request auth context exists
- Tasks are user-scoped
- Wallet is user-scoped
- agent conversations are user-scoped
- the old shared-secret browser auth flow is removed from the active path

### 10.2 Current auth model

Current implemented model:

- first-party users with email + password
- server-managed sessions
- `httpOnly` cookie for the web app
- same-origin web auth routes
- plain `user` role only for now
- no admin role, no RBAC, no organizations

### 10.3 What remains next

The initial hardening slice is now done in the repo:

- dedicated auth route coverage exists for register, login, `/api/auth/me`, logout, profile update, password change, security overview, and remote-session revocation
- explicit cross-user isolation tests exist for `Tasks` and `Wallet`
- repository-level ownership enforcement has been tightened in active wallet flows
- audit-log attribution covers the current user-lifecycle actions
- profile updates and password change are implemented end to end
- the authenticated shell includes account settings and a security center

The next auth/platform slice should focus on operational trust and cleanup:

1. keep repository ownership verification as a gate for any future domain module
2. add failed-login visibility and rate-limit hardening if production exposure increases
3. decide whether the current single-value `role` field should remain as future-proofing or be removed
4. keep docs and onboarding material aligned with the current session-based auth model
5. validate the current auth/session flow under real production deployment conditions before another backend domain is started

### 10.4 Production reset constraint

The product decision remains:

- the app is not currently used by anyone
- production data can be discarded
- the production database can be reset instead of migrated for legacy compatibility

This means the project should still avoid spending time on backward-compatible auth migration logic.

### 10.5 Gating rule before another module

Do not start another domain module until:

- the current auth/session flow is stable in production
- cross-user isolation is tested
- repository ownership enforcement is verified
- the settings/security center behavior is trusted end to end
- Tasks and Wallet are confirmed safe under multi-user access

---

## 11. Source-of-Truth Notes

When reconstructing project state in future sessions:

- trust the current codebase first
- trust `README.md` and this `PLAN.md` second
- use Claude memory summaries as historical context
- treat `docs/PRODUCT.md` as vision, not current scope
- treat older review docs as useful but not automatically current

Current concise summary:

- `Tasks` is real and stable
- `Wallet` is the second active domain and remains newer than `Tasks`
- the rest are inactive
- the architecture is sound
- auth is implemented across login, lifecycle, settings, and session security
- the immediate platform challenge is keeping docs, production behavior, and future module work aligned with the now multi-user-safe base
