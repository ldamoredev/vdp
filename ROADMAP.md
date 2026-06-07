# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture, module rules, agent rules, safety, and verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; must be production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | Schema scaffold only | Disabled demo/API pages | — | Inactive; not a real domain yet |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Order Of Work

1. Recovery: restore local confidence, CI, and manual app verification.
2. Tasks production-readiness: validate the module end to end before real daily use.
3. Auth hardening: strengthen the already-complete Auth V1 flow under production-like conditions.
4. Expansion: only after the previous gates pass, choose and build the next real domain.

No new product/domain work should start until the recovery and Tasks gates are complete.

## Phase 0: Recovery

### 1. Restore The Local Quality Baseline

Goal: make the repo locally verifiable again after the long pause.

Do:

- Bring up whatever infrastructure is needed for database-backed tests.
- Identify the exact local commands for shared build, web/server typecheck, unit tests, integration tests, e2e tests, and lint.
- Add or repair lint scripts only if no standard lint command currently exists.
- Run targeted checks before broad suites and document any remaining failures.

Target verification:

- `pnpm --filter @vdp/shared build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm --filter @vdp/web test`
- `pnpm --filter @vdp/server test:unit`
- `pnpm --filter @vdp/server db:test:up`
- `pnpm --filter @vdp/server test:integration`
- `pnpm --filter @vdp/server test:e2e`

Done when: the local quality baseline is either green or has a short, explicit failure list with owners/next fixes.

### 2. Fix Repository CI

Goal: make CI match local verification and become trustworthy again.

Do:

- Align CI with Node 22 and the pnpm version pinned in `package.json`.
- Use the same commands proven in the local quality baseline.
- Include shared build, web/server typecheck, lint when available, web tests, server unit tests, and database-backed suites.
- Ensure test Postgres is started explicitly for integration/e2e work.
- Keep secrets out of logs and workflows.
- Make each CI failure reproducible locally.

Done when: CI is green on the main workflow and the README or workflow names make the matching local commands obvious.

### 3. Bring Up The Full App For Owner Verification

Goal: let the owner verify that frontend and backend actually work locally.

Do:

- Start local infrastructure.
- Run migrations or a documented local reset/migrate flow.
- Start backend and frontend.
- Provide local URLs and a concise manual smoke path.
- Verify auth, backend health, frontend shell/routing, Tasks, and Wallet at minimum.

Done when: the owner can open the app locally, register/login or use the agreed local auth flow, and perform a small Tasks and Wallet smoke without hidden context from this thread.

## Phase 1: Tasks Production Readiness

Goal: Tasks becomes safe enough for real personal task management.

Backend coverage:

- CRUD: create, list/filter, read, update, delete.
- Status transitions: complete, carry over, carry over all, discard.
- Notes and task detail behavior.
- Stats/review/history behavior.
- Insights/SSE behavior.
- Agent chat and tool behavior.
- Cross-user isolation on all user-owned task data.
- Timezone-safe date handling.

Frontend coverage:

- Create task quickly.
- Edit task.
- Complete task.
- Carry over and discard task.
- Add/read notes and task detail.
- Use today's dashboard.
- Use history/review views.
- Verify loading, empty, error, and busy states for normal daily use.

Verification:

- Server unit, integration, and e2e suites relevant to Tasks.
- Web tests relevant to Tasks.
- Web and server typechecks.
- Lint once available.
- Manual browser smoke across the core daily loop.

Done when: there are no known P0/P1 Tasks bugs, no known cross-user data leaks, and any accepted lower-priority gaps are listed clearly.

## Phase 2: Auth Hardening

Auth V1 is complete: first-party users, email/password login, server-managed sessions, profile/security routes, and audit logs exist. The next work is hardening, not rebuilding.

Do:

- Validate the production session flow end to end through Vercel, Render, and Supabase.
- Add or verify failed-login rate limiting.
- Verify cookie/session behavior across login, logout, logout-others, expiration, and password change.
- Review auth audit logs for useful production diagnostics.
- Add observability for auth failures and suspicious patterns without leaking secrets.

Done when: production-like auth smoke passes, session failure modes are understood, and no known P0/P1 auth bugs remain.

## Phase 3: Expansion

Do not start this phase until Recovery, Tasks readiness, and Auth hardening are complete.

Most likely next candidate: Health, because it already has a scaffold schema and disabled/demo frontend pages.

Before making any inactive domain real, satisfy the New Domain Gate in `AGENTS.md`. At minimum, the domain needs backend module registration, migration, entities, repositories, services, HTTP controllers using auth context, cross-user isolation tests, shared contracts, frontend feature module, navigation registration, and agent tooling only after the auth-context rules are satisfied.

Done when: the new domain meets the Tasks reference shape and is verified through local checks, CI, and a manual owner smoke.

## Data Constraint

Production data can be discarded until the Tasks production-readiness checkpoint is complete. Once Tasks starts being used for real personal work, stop assuming task data is disposable and reassess migration/backfill discipline.
