# VDP Current State

Code-verified on 2026-04-05.

This document is the current status reference for the repository as verified from the codebase and local test runs on 2026-04-05.

If this file conflicts with older memory, review notes, or stale local tooling config, trust this file and the current codebase first.

## 1. Product Scope

VDP is a modular personal AI operating system.

The active implementation scope in the repository is:

- `Tasks`
- `Wallet`

The long-term vision still includes:

- `Health`
- `People`
- `Work`
- `Study`

But those domains are not currently verified as live backend modules.

## 2. Active Workspace

The repository is a 3-package monorepo:

- `apps/web`
- `server`
- `packages/shared`

Older references to separate frontend packages like `@vdp/wallet-frontend` or `@vdp/health-frontend` are stale.

## 3. Verified Domain Status

| Domain | Backend | Frontend | Agent | Tests | Status |
|--------|---------|----------|-------|-------|--------|
| Tasks | Implemented | Implemented | Implemented | Verified | Stable reference module |
| Wallet | Implemented | Implemented | Implemented | Strongly verified at unit level | Active, still product-labeled as in progress in some older docs |
| Health | Not verified | Placeholder / partial frontend | Not verified | Not verified | Inactive |
| People | Not verified | Demo page | Not verified | Not verified | Inactive |
| Work | Not verified | Demo page | Not verified | Not verified | Inactive |
| Study | Not verified | Demo page | Not verified | Not verified | Inactive |

## 4. Tasks Status

The following are verified in code:

- `/tasks` dashboard
- `/tasks/history`
- `/home`
- `/login`
- persisted agent conversations
- task chat endpoint
- SSE insights stream
- live frontend cache sync after chat-driven mutations
- clarification gate in task creation flow
- planning and review flows
- embeddings-based similarity search
- repeat-pattern detection
- `TaskRepeatDetected` event handling
- `get_recommendations` agent tool

Tasks remains the strongest and most coherent module in the system.

## 5. Wallet Status

Wallet is not just scaffolded. It is implemented across backend, frontend, and agent layers.

### Backend

Verified in code:

- module registration in `DefaultCoreConfiguration`
- service graph in `WalletModuleRuntime`
- repository interfaces plus Drizzle and fake implementations
- REST controller under `/api/v1/wallet`
- agent controller under `/api/v1/wallet/agent`
- spending spike event detection

### Frontend

Verified pages:

- `/wallet`
- `/wallet/accounts`
- `/wallet/categories`
- `/wallet/transactions`
- `/wallet/transactions/new`
- `/wallet/stats`
- `/wallet/savings`
- `/wallet/investments`

Verified frontend provider/data layer:

- scope-based `WalletProvider`
- query hooks
- mutation hooks
- creation logic

### Wallet agent tools

Verified tool surface in code:

- accounts
- transactions
- stats
- savings
- investments
- exchange rates

Current tool count in code: 15.

### Important status note

Older docs that describe Wallet as missing major frontend mutation support or missing backend event-handler tests are stale relative to the current code.

What is still true is that Wallet is newer than Tasks and has less long-term confidence than Tasks, even though the implementation surface is broad.

## 6. Cross-Domain Behavior

The first real cross-domain signal is implemented.

Verified flow:

1. Wallet emits a spending-spike signal.
2. Tasks listens for `wallet.spending.spike`.
3. Tasks creates:
   - an insight
   - a high-priority review task scheduled for today

This is implemented in `CrossDomainEventHandlers` and covered by unit tests.

## 7. Architecture Rules Verified In Code

These rules are implemented and should be treated as current architecture:

- modular monolith
- shared runtime dependencies built in `Core`
- dependencies passed through `ModuleContext`
- no singleton pattern in runtime architecture
- provider abstraction for agent models
- provider abstraction for embeddings
- local-date helpers used instead of `toISOString().slice(0, 10)`
- SSE endpoints using `reply.hijack()` set CORS headers manually

## 8. Auth and Runtime Notes

- Frontend login flow uses session auth.
- Backend auth uses first-party users with email + password.
- Session lookup accepts `x-session-token` and the `vdp_session` cookie.
- Protected backend routes depend on the auth middleware and request auth context.
- Registration is open only for the first user unless the server-side rule changes.
- Profile updates are supported for the current user.
- Password changes require the current password and revoke existing sessions.
- A dedicated `/settings` area exists in the authenticated web shell.
- The settings area includes profile editing, password change, active-session visibility, recent auth events, and "log out other devices".
- Auth audit logging now covers register, login, logout, profile update, password change, and remote-session revocation.

This is the active auth model in the current codebase and should be treated as the source of truth over older notes that mention `ACCESS_SECRET`.

## 9. Test Verification

Verified on 2026-04-05:

- `apps/web`: 131 tests passed
- auth integration suite passed against the local Postgres test database
- auth e2e suite passed against the local Postgres test database

Verified frontend test files:

- tasks selector tests
- tasks history selector tests
- tasks chat-sync tests
- wallet selector tests
- wallet creation logic tests
- wallet transaction creation logic tests
- shared API client tests
- auth client helper tests
- auth/login message tests
- shell navigation state tests

Verified backend unit coverage includes:

- task services
- task event handlers
- task cross-domain handlers
- wallet services
- wallet tools
- wallet event handlers
- spending spike detection
- wallet agent behavior

### Additional e2e verification completed on 2026-04-05

The following backend suites were run successfully against the local Postgres test database:

- auth flow coverage for register, login, `/api/auth/me`, and logout
- auth lifecycle coverage for profile update and password change
- auth security overview and remote-session revocation
- wallet cross-user isolation for account/category/goal reference ownership
- tasks cross-user isolation for read, update, and delete

## 10. Inactive and Stale Areas

### Inactive domains

`People`, `Work`, and `Study` are demo-style frontend pages.

`Health` is inconsistent:

- frontend pages and a client API wrapper exist
- no server `HealthModule` or verified health routes were found

So Health should not be treated as an active backend domain.

### Stale artifacts

These should not be treated as current truth by themselves:

- `.claude/launch.json`
- older Claude memory from March 2026
- older review docs that describe missing Wallet tests or missing Tasks intelligence features already present in code

## 11. Source-of-Truth Rule

When reconstructing project state:

1. trust the current codebase first
2. trust this file second
3. trust `PLAN.md` as roadmap context
4. use older memory and review docs only as historical context
