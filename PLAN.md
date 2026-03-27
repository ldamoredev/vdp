# VDP Plan

Updated: 2026-03-27

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

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | Implemented | Implemented | Implemented | Stable |
| Wallet | Partially implemented | Partially implemented | Partially implemented | In progress |
| Health | Not active | Placeholder/demo | Not active | Inactive |
| People | Not active | Demo/inactive | Not active | Inactive |
| Work | Not active | Demo/inactive | Not active | Inactive |
| Study | Not active | Demo/inactive | Not active | Inactive |

Important nuance:

- `Tasks` is the only domain that is clearly complete enough to be called the current product
- `Wallet` is now the active expansion track in code, but the contract is not fully aligned yet

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

### 6.1 What is implemented

Backend routes currently exist for:

- accounts
- categories
- transactions
- wallet stats summary
- wallet agent conversations/chat

Frontend pages currently exist for:

- `/wallet`
- `/wallet/transactions`
- `/wallet/transactions/new`
- `/wallet/stats`
- `/wallet/savings`
- `/wallet/investments`

### 6.2 What is still inconsistent

The current frontend/backend contract is ahead of the backend implementation.

Frontend API expects more than the backend currently exposes, including routes for:

- savings goals
- savings contributions
- investments
- category stats
- monthly trend
- exchange rates

The backend controller currently exposes only:

- accounts
- categories
- transactions
- stats summary

So Wallet is not yet a stable or fully aligned module.

### 6.3 Product status decision

Because of that mismatch, Wallet should be treated as:

- the active second-domain build
- not yet stable
- not yet at Tasks quality level
- not yet a reliable production claim

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

### 7.3 Wallet contract mismatch

This is the clearest current implementation risk:

- frontend navigation and landing page already present Wallet as active
- backend does not yet cover the full Wallet API surface implied by the frontend

### 7.4 Date-rule regression risk

The project memory explicitly forbids `toISOString().slice(0, 10)` for local-date logic.

The current Wallet investments page still uses:

- `new Date().toISOString().slice(0, 10)`

That conflicts with the established date rule and should be treated as unresolved project risk.

### 7.5 Unverified older findings

Older reviews identified several issues around:

- database performance
- vector indexing
- coverage policy
- error boundaries
- silent embedding failures

Some old findings are already resolved, but not every older review item has been re-verified against the current worktree. They should be treated as partially open until checked again.

---

## 8. Delivery Strategy From Here

The project should continue with a disciplined sequence.

### 8.1 Immediate priority

Stabilize the current repo around:

1. proven `Tasks`
2. one coherent `Wallet` MVP slice

### 8.2 Definition of a real Wallet MVP

Wallet should only be considered active when it has:

1. aligned frontend and backend contracts
2. shared schemas in `packages/shared`
3. thin HTTP routes over services
4. agent tools over the same services
5. tests following the Tasks template
6. no obvious broken routes in navigation

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

### Phase A — Keep Tasks authoritative

- preserve Tasks as the reference module
- keep Tasks architecture, contracts, and tests as the baseline
- avoid diluting the product narrative back into six active modules

### Phase B — Finish Wallet as the second real domain

- finish the missing backend Wallet surface needed by the current frontend
- or reduce the frontend to the smaller backend surface if that becomes the chosen MVP
- align the API contract end-to-end
- test Wallet with the same standard used for Tasks

### Phase C — Prove the first cross-domain signal

- wire one concrete Wallet-to-Tasks interaction
- keep it narrow and testable
- avoid building a general orchestration engine too early

### Phase D — Reassess further domains

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

- `Tasks` is real
- `Wallet` is actively being built
- the rest are inactive
- the architecture is sound
- the current challenge is product convergence, not more breadth
