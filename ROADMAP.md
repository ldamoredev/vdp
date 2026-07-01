# VDP Roadmap

Forward-looking only. Shipped work is not narrated here — check `git log`/`git blame`
for how and when something landed. For setup and commands see
[`README.md`](./README.md). For architecture, module rules, agent rules, safety, and
verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, weight trend, daily mood/energy check-ins, and private medical records section; medical has no agent by design |
| Projects | ✅ | ✅ | — | Active direction, board, client catalog, time tracking, hours report, and expected-income link to Wallet |
| Objectives | ✅ | ✅ | — | Active Life Goals layer: quarterly/annual objectives with achieved detection plus manual, Projects-hours, completed-tasks, Wallet-savings, and Health-habit-completions read-time progress |
| Inbox | ✅ | ✅ | — | Active: frictionless capture + pending queue (Bandeja) + triage routing to Tasks/Wallet via prefilled deep-links + LLM-powered smart triage suggestion (never auto-routes) |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

The agent layer (Tasks) is proactive: an auto-authored daily brief and weekly prep seed
the chat on `/home`/`/review`, and stuck/overloaded-task insights are folded into that
brief as concrete nudges. Medical stays off the LLM by design.

## Status

All six product directions scoped in mid-2026 (D1–D6: cross-domain density, the Today
command center, Work/Projects, Life Goals, Universal Inbox, the proactive agent) have
shipped; the codebase and commit history are the record. One item from that era stays
deliberately parked (R4, at the bottom). The active backlog is R6–R10 below, in
priority order — one per session, per the working agreement in `AGENTS.md`.

## Next Up (scoped July 2026)

Ordered cheapest-first so the quick wins land before the big builds: one small
session (R6), two medium ones that extend existing surfaces (R7, R8), then two
full feature builds (R9, R10).

### R6. Reorder module navigation

Tiny UI session. New order: **Bandeja (inbox), Tasks, Projects, Wallet, Health,
Metas (objectives)**, then the disabled demos (People, Work, Study).

- Reorder the `domains` array in `apps/web/src/lib/navigation.ts` — lookups use
  `find()` by key, so order only affects rendering.
- Check for tests or components that assert the current order (shell nav, mobile nav)
  and update them.
- Verification: `pnpm typecheck:web` + web unit tests + a browser smoke of the shell.

### R7. Projects: archive surface + project history

Backend archive already exists end-to-end: `Project` has `status`
(`active|archived`) + `archivedAt`, `ArchiveProjectCommand` is registered, and the
web core has `ArchiveProject`. `ListProjects` returns all statuses. What's missing is
the product surface:

- Expose an archive action on the project card/detail in
  `apps/web/src/ui/screens/projects/` (confirm-guarded; archived projects drop out of
  the active list and the board).
- Add a "Historial" view (nav item under Projects) listing archived projects with
  `archivedAt`, outcome, client, and total logged hours — a read of what already
  comes back from `ListProjects`, filtered client-side by the presenter.
- Add an `UnarchiveProjectCommand` (backend + web) so archiving is reversible from
  the history view — mirror of the archive command, plus `Project.unarchive()`.
- Decide what archived means for time entries and task links: keep them readable
  (history/report), block new logging against archived projects.
- Tests: entity unit tests for unarchive, presenter tests for the history filter,
  e2e archive→history→unarchive flow. Cross-user isolation already covered by the
  Projects e2e pattern.

### R8. Hours report → PDF export

The hours report exists (`GetProjectHoursReportQuery` backend,
`HoursReportSection` + presenter web-side, filtered by client/project/week). Add an
export of the currently-viewed report.

- Recommended approach: a print-friendly rendering + browser print-to-PDF — a
  dedicated `@media print` stylesheet (or a clean `/projects/report/print` route)
  with client, project, period, entries table, total hours, and expected income per
  currency. Zero new dependencies, matches the "no new abstractions" rule.
- Fallback if the print output isn't controllable enough: a small client-side PDF
  lib (e.g. `pdf-lib`) generating the same content. Decide at session start; do NOT
  reach for server-side/headless-browser PDF generation.
- The export honors whatever filters the presenter has active ("segun el proyecto
  que estoy parado") — it exports the current view, not a global dump.
- Verification: typecheck + presenter test for the export view model + manual
  print-to-PDF smoke in the browser.

### R9. Wallet: Préstamos (loans) section

New Wallet sub-section for money lent and borrowed. Full feature through the
per-feature gate; likely one session backend + one frontend.

- Domain: `Loan` aggregate in `wallet/domain/` — direction (`lent|borrowed`),
  counterparty name, principal amount + currency, date, optional due date, note,
  status (`open|repaid|forgiven`), plus `LoanPayment` child records (partial
  repayments with date + amount). Per-currency ALWAYS — never sum ARS+USD; outstanding
  balance = principal − payments, computed per loan.
- Backend: rich-entity style (status transitions live on the entity), CQBus
  Create/List/Get/RegisterPayment/MarkRepaid/Forgive commands + queries, routes under
  `/api/v1/wallet/loans`, the three synchronized DB changes (schema + `SETUP_SQL` +
  `TRUNCATE`), fake repo, cross-user isolation tests. Follow `create-aggregate` and
  `create-service-api` skills.
- Frontend: `/wallet/loans` nav item ("Prestamos"), screen with open/closed split,
  outstanding-per-currency summary wearing `.font-data`, quick payment registration.
  Follow `create-service-web` + `create-presenter-web`.
- Explicitly out of scope for the first slice: auto-creating Wallet transactions from
  loan payments (suggest-don't-write applies; a deep-link to the pre-filled
  transaction form is enough), agent tools, and insights. Revisit after daily use.

### R10. Superadmin

Biggest item — split into slices, likely two sessions. The `users` table already has
a `role` varchar (default `'user'`), so no schema change for the role itself.

- **R10a — Role plumbing + settings store.** Expose `role` through the auth context
  and session/profile response; add a `requireRole('superadmin')` guard for
  controllers (and surface role client-side via the session payload). Promote the
  owner account via a forward-only migration or a one-off script. Add a
  `core.app_settings` key/value table (three synchronized DB changes) with two flags:
  `registrationEnabled` (default true) and `chatEnabledForUsers` (default true), plus
  CQBus Get/Update handlers guarded by the role.
- **R10b — Enforcement + admin UI.**
  - Pause registration: `/api/auth/register` checks `registrationEnabled` → 403 with
    a clear message; login stays open.
  - Chat gating: agent chat routes check `chatEnabledForUsers` for non-superadmins;
    the superadmin always has chat when an agent provider is configured (existing
    provider detection). The web shell hides chat affordances for gated users —
    flags reach the client through the session/bootstrap payload, not a public
    endpoint.
  - Admin surface: a settings section (e.g. `/settings/admin`), rendered only for
    the superadmin, with the two toggles. No separate module — this lives in auth +
    settings.
- Tests: role-guard tests (user hits admin endpoint → 403), registration-paused e2e,
  chat-gated e2e for a non-admin user, and cross-user isolation as always.
- Explicitly deferred: user management (list/disable users), per-user chat toggles,
  audit UI. "Acciones privilegiadas" beyond these two flags get scoped when a
  concrete need appears.

## Parked

### R4. Unify /home + /review into one "Today" surface — NOT STARTED (maybe skip)

The original D2 ask was one daily surface with morning/evening phases by time of day.
`/home` and `/review` already cover the morning-plan / evening-close split as two
separate, working screens with shared server-backed ritual state
(`daily_review_state`), so merging them is a refactor of things that already work, not
a capability gap. Highest risk/effort-to-value ratio of anything left. Revisit only if
having two screens instead of one becomes an actual daily friction point — don't do it
speculatively.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
