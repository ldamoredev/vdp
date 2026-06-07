# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture and agent guidance use [`AGENTS.md`](./AGENTS.md). `CLAUDE.md` is legacy until the documentation consolidation below removes it.

## Active vs Inactive

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable — reference module |
| Wallet | ✅ | ✅ | ✅ | Active — newer than Tasks, lighter frontend coverage |
| Health | Schema scaffold only | Disabled demo/API pages | — | Inactive — not a real domain yet |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Immediate Recovery Sequence

These items come before the existing harden/expand pendings. Do not start new product/domain work until this sequence is complete.

1. **Consolidate documentation around `AGENTS.md`**
   - Make `AGENTS.md` the source of truth for agents, architecture, module rules, auth-context rules, safety rules, and verification commands.
   - Migrate any still-useful architecture guidance out of `CLAUDE.md`, then delete `CLAUDE.md`.
   - Register the current architecture accurately: `auth`, `tasks`, and `wallet` are active backend modules; `health` is only partially scaffolded; `people`, `work`, and `study` are placeholders.
   - Reconcile doc drift between `README.md`, `AGENTS.md`, and this roadmap, including package manager version, active database schemas, available commands, and domain status.
   - Keep private env/credential guidance explicit: never read or print `.env`, `.env.*`, `.key`, `.pem`, `.secret`, or `.claude/dev-credentials.env`.

2. **Do a fine roadmap cleanup pass**
   - Remove completed, stale, or duplicate items.
   - Split roadmap items into clear recovery, hardening, and expansion phases.
   - Convert vague goals into executable gates with verification commands or acceptance criteria.
   - Keep only forward-looking work here; move setup, command reference, and architecture reference back to `README.md` / `AGENTS.md`.

3. **Restore the local quality baseline**
   - Bring up whatever infrastructure is required to run the relevant test suites.
   - Verify TypeScript for web and server.
   - Verify ESLint/linting; add or repair missing scripts only if the repo cannot currently run lint in a standard way.
   - Run targeted tests first, then broaden to the full suite once failures are understood.

4. **Fix repository CI**
   - Ensure CI installs the correct pnpm/Node versions and uses the same commands as local development.
   - Include typecheck, lint, server unit tests, web tests, and database-backed tests with an explicit test Postgres service when needed.
   - Make CI failures reproducible locally and document the matching local command.
   - Keep secrets out of logs and workflows.

5. **Bring up the full app for manual verification**
   - Start the required local infrastructure, migrations, backend, and frontend.
   - Provide the local URLs and exact manual smoke path for the owner to verify auth, backend health, frontend routing, Tasks, and Wallet.
   - Ensure the owner can validate the app without needing hidden context from this thread.

6. **Fully validate the Tasks module for real personal use**
   - Treat Tasks as the first production-like module: it must be 100% functional end to end before daily use starts.
   - Cover backend CRUD, status transitions, notes, stats, review, history, insights/SSE, agent chat, auth isolation, and timezone-safe date behavior.
   - Cover frontend flows for creating, editing, completing, carrying over, discarding, reviewing, and browsing task history.
   - Run server unit/integration/e2e tests, web tests, typechecks, lint, and a manual browser smoke.
   - Exit criteria: no known P0/P1 Tasks bugs, no cross-user data leaks, and a clear list of any accepted lower-priority gaps.

## Current Pendings After Recovery

Auth V1 (multi-user, sessions, profile/security center, audit logs) is done. The platform is multi-user-safe. Two natural next paths:

1. **Harden** — failed-login rate limiting, production session-flow validation, observability for auth events
2. **Expand** — pick the third domain (Health is the most coherent candidate; backend partially scaffolded already)

The default sequencing is: recover and validate Tasks first, harden auth second, expand third. New domain work should not start until the auth flow has been validated under real production conditions.

## Gating: Before Adding a New Domain

A domain is only "real" when it matches the Tasks template:

1. Module registered in `DefaultCoreConfiguration`
2. Drizzle schema + migration applied
3. Domain entity (`fromSnapshot` / `toSnapshot`)
4. Repository interface + Drizzle impl + Fake repo
5. Use-case services (one class per operation)
6. HTTP controller using `authContextStorage` for `userId`
7. Cross-user isolation tests
8. Frontend feature module following the two-context pattern
9. Shared zod schemas in `@vdp/shared` for cross-package types
10. Pages registered in `apps/web/src/lib/navigation.ts`

Use `/new-server-module <domain>` and `/new-frontend-module <domain>` to scaffold against this template.

## Cross-Domain Behavior

The first cross-domain signal is live: Wallet emits `wallet.spending.spike` → Tasks creates a high-priority review task and an insight. Implementation in `CrossDomainEventHandlers`.

Future cross-domain signals should follow the same pattern: emit a domain event from the source module, subscribe in the target module via `eventBus`, run actions through services (never direct DB writes), and write tests for both the happy path and error resilience (event bus must never block).

## Production Constraint

Production data can be discarded until the Tasks production-readiness checkpoint is complete. Once Tasks starts being used for real personal work, stop assuming task data is disposable and reassess migration/backfill discipline.
