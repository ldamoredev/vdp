# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture, module rules, agent rules, safety, and verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, weight trend, daily mood/energy check-ins, and private medical records section; medical has no agent by design |
| Projects | ✅ | ✅ | — | Active direction, board, client catalog, time tracking, hours report, and expected-income link to Wallet |
| Objectives | ✅ | ✅ | — | Active Life Goals layer: quarterly/annual objectives with achieved detection plus manual, Projects-hours, completed-tasks, and Wallet-savings read-time progress |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Order Of Work

1. ~~Recovery: restore local confidence, CI, and manual app verification.~~ Done.
2. ~~Tasks production-readiness: validate the module end to end before real daily use.~~ Done (June 2026 hardening).
3. ~~Auth hardening: strengthen the already-complete Auth V1 flow under production-like conditions.~~ Done code-side (rate limiting + failure auditing); the owner production smoke remains.
4. ~~Expansion: Health shipped as the habits slice, deepened with H1 counters, H2 goals, H3 private medical records, P1 flexible cadence, P2 daily mood/energy check-ins, and P3 weight tracking.~~ Done
5. ~~**Architecture Track**: frontend mirror (Vite SPA + presenters + CQBus + Core) and CQBus on the api.~~ Done (June 2026). Full analysis and decisions in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md). Done
6. **Product Directions** (June 2026): six candidate directions recorded below. **D1 (cross-domain densification) shipped** — all three slices; see the D1 execution section. **D2 ("Today" command center) in progress** — found mostly already built; remainder (R1–R4) in the D2 execution section below. **D3 (Work / Projects) shipped** — D3a project aggregate + task linking + board, D3b client catalog + time tracking + hours report, D3c Task ↔ Project selector, and D3d cross-domain slices. **D4 (Life Goals) shipped for the planned D4a–D4d scope** — Objective CRUD plus manual, Projects-hours, completed-tasks, Wallet-savings, and specific Health-habit progress, achieved detection, and Home surface. **D5 (Universal Inbox + triage) planned** — slice breakdown (D5a–D5c) in the D5 execution section below.

## Product Directions (Candidates — June 2026)

Recorded for the owner to choose from; nothing here is committed or scheduled
**except where a direction has its own execution section below** (D1 is in
progress). The architecture is no longer "under construction" and the UI has
identity, so these are framed as product, not infrastructure.

**Framing lens — the loop, not the module list.** The product thesis is
**capture → decide → execute → learn**. VDP today is strong at *capture* and
*execute*, and weak at *decide* (the synthesis surface is passive) and *learn*
(cross-domain composition — the real differentiator — barely lives: essentially
one signal, `wallet→tasks`). The directions are ranked by which loop stage they
repair, not by "which module to add next". A fourth siloed module competes with
better standalone apps; deepening the loop does not.

Current state these build on: three deep, stable modules (Tasks, Wallet, Health —
Health now covers counters, deadline goals + habit graduation, weight trend,
mood/energy check-ins, private medical records). `/review` and `/home` already
exist. People / Work / Study exist only as disabled demo pages. The agent layer
is the strongest part of the product but is reactive and per-domain. Medical stays
off the LLM by design.

### D1. Densify the cross-domain fabric — *learn* — NOT a new module

Highest leverage-per-effort: the differentiator's infra already exists, only one
signal lives (`wallet→tasks` spike → task). Cheap additions with current infra:

- `tasks→wallet`: completing "pay the rent" → offer to register the transaction.
- `health→wallet`: delivery/pharmacy spend ↔ a nutrition goal / treatment.
- **Recurring transactions** in Wallet — today all entry is manual, so stats and
  spike detection operate on incomplete data.

Reframe vs a trends dashboard: the differentiator is **signal → action**, not a
cold analytics page.

**Status (June 2026): in progress.** Slice breakdown and D1a (shipped) in the
"D1: Cross-Domain Densification" execution section below.

### D2. "Today" as a real command center — *decide*

`/home` and `/review` exist but separate and passive. Unify them into one daily
surface (morning plan + evening close) and **bring the agent onto it** — today the
chat panel returns `null` outside an active domain, so on `/home` and `/review`
(the two synthesis surfaces) Ctrl+K is a no-op. This is the screen opened ~20x/day;
its passivity is the biggest waste.

**Status (June 2026): mostly already shipped — this framing is stale.** On opening
D2 the chat panel was already global (falls back to a user-selectable agent
outside a domain), `/home` was already a command center with quick capture +
cross-domain signals, and `/review` a full server-backed close ritual. The real
remainder (R1–R4) lives in the "D2" execution section below.

### D3. Activate Work / Projects — *execute → direct* — new module

Strongest new-module candidate because it resolves an existing tension: tasks are
already tagged `domain: "work"` and the Tasks prompt already punts ("if it grows in
complexity, move it to Work"). Projects with outcome + next action + weekly focus
turn Tasks from pure execution into direction. **Gate:** define the
daily-task ↔ project boundary first, or the two cannibalize. Passes the New Domain
Gate; second domain, not People.
Owner edit: Time/Hours load and report for track how much I spend time in a project to then inform it to my bosses/clients.

**Status (June 2026): shipped.** The boundary gate is resolved (a Project owns an
outcome, not a separate task store), and the shipped slices live in the "D3:
Activate Work / Projects" execution section below.

### D4. Life Goals (Goals 2.0) — *decide, top layer* — strategic layer

Health already has deadline goals + goal→habit graduation. Lift that primitive to a
**cross-module layer**: quarterly/annual objectives pulling metrics from
health/wallet/tasks — the "north" the day-to-day ladders up to. Cheap (reuses an
existing primitive); risk is it turns decorative if not wired to real metrics.

**Status (June 2026): shipped through D4d.** D4a shipped the real Objective
aggregate and one live metric (`projects_hours`) so the layer is not decorative.
D4b added persisted lazy-on-load achieved detection plus composed
`tasks_completed` and per-currency `wallet_savings` metrics. D4c surfaces
objectives on Home as the daily north and can create a simple task for today from
an objective. D4d tracks completions for one selected Health habit. Strong
objective↔task/focus linkage and broader Health metric sources remain future
slices.

### D5. Universal inbox + triage — *capture* — enhancer

Capture anything from anywhere (thought, expense, symptom, person) → triage into the
right module. Net-new but cheap, feeds every module. A multiplier on the capture
habit, not a headline direction.

**Status (June 2026): promoted to a planned execution (owner-directed).** Decisions
and slice breakdown in the "D5: Universal Inbox + Triage" execution section below.

### D6. Proactive agent (not a prettier chat) — *decide + learn* — enhancer

The agent layer is excellent but reactive and per-domain. Make it proactive: morning
brief, weekly prep, "you left X pending". Pairs naturally with D2 (it is the brain of
the command center). Respects the medical-no-LLM rule.

### Recommended sequence (owner decides)

> **D1 (cross-domain density) + D2 ("Today" command center with agent) as one push
> → D3 (Work, boundary defined first) → D4 (Goals 2.0).** D5 (inbox) and D6
> (proactive agent) slot in opportunistically.

Rationale: before opening a **fourth module**, exploit the moat already in place
(composition) and fix the decision surface (Today is passive). **People and Study are
explicitly deferred** — low daily composition, consistent with
[`PRODUCT_ANALYSIS.md`](./PRODUCT_ANALYSIS.md) ("CRM with little to compose daily";
Study "last"). Pick by which loop stage is broken, not by which module is next: today
the broken stages are *decide* and *learn*, both fixable without new modules.

## D1: Cross-Domain Densification (COMPLETE — June 2026)

Owner-directed promotion of D1 from candidate to active work. Same discipline as the
Health series: one full-stack slice at a time, each shipping before the next. The
differentiator is **signal → action**; the gap was directionality — only
`wallet→tasks` (spending spike) lived. All three slices shipped, in order:

### D1a. tasks→wallet — "register the expense?" — SHIPPED June 2026

Completing a payment-intent task surfaces a wallet `suggestion` to register the
expense, deep-linked to a pre-filled quick-add. Verified in the owner's session
(both the isolated deep-link prefill and the live cross-domain toast).

- **Architectural move — cross-domain is no longer Tasks-only.** The reaction (a
  wallet insight) belongs to Wallet, so it lives in
  `wallet/services/WalletCrossDomainEventHandlers.ts` subscribing to
  `tasks.task.completed`. AGENTS.md "Cross-Domain Behavior" now states the general
  rule: the module that owns the reaction's output owns the subscriber. This closes
  the "directionality" gap flagged in `PRODUCT_ANALYSIS.md`.
- `TaskCompleted` enriched with `title`/`domain` (the event carries its payload; the
  subscriber does not read back). Payment intent is a conservative Spanish-verb
  title heuristic in `wallet/services/payment-intent.ts` (infinitive, voseo
  imperative, first-person past; whole-word so "comprobar" ≠ "comprar").
- **Suggest, never auto-write** (same principle as H1): the amount is unknown, so
  the wallet never creates the transaction — it offers, via
  `/wallet?type=expense&description=<title>` opening the quick-add pre-filled with
  the task title. The web parser still accepts the legacy `registrar-gasto` alias
  for already-persisted insights.
- Surface (owner decision): the live SSE toast was made actionable —
  `actionHref`/`actionLabel` now render as a button in `toast-container.tsx`. A
  durable surface (the suggestion is a 6s toast today, no persistent list since
  wallet insights have no GET) was **explicitly deferred** as a follow-up.

### D1b. health→wallet — diet goal ↔ delivery spend — SHIPPED June 2026

Each active weight/diet goal (a `Goal` with `targetWeightKg`) shows this week's
eating-out / delivery spend, pulled from Wallet, with a link to those movements.
Verified in the owner's session.

- Read-time composition (owner decision): diet is a reflective goal, not a discrete
  action, so a per-purchase nudge would be preachy — the number lives on the goal
  card, where it's relevant. The composition is done in the web `GoalsPresenter`
  (the mirror pattern: a presenter composes Health + Wallet queries over the bus),
  with no backend coupling between the modules.
- New currency-safe Wallet query `GetFoodSpendingThisWeekQuery` groups eating-out
  spend by currency (never mixes ARS/USD); the food heuristic lives in
  `wallet/services/food-category.ts`. Pharmacy/medication is **out** by the
  medical-privacy rule (no medication entity, no LLM/cross-domain over medical).

### D1c. Recurring transactions — SHIPPED June 2026

Rent/subscriptions/utilities as recurring rules that **materialize real
transactions** lazily on wallet load (no scheduler), so stats and spike detection
stop operating on incomplete data. Verified in the owner's session.

- `RecurringTransaction` rich entity owns `dueOccurrences` (monthly, day-of-month
  clamped to short months, respects start/end/last-run). New table + the three
  synchronized DB changes + forward-only migration `0009`. CQBus
  Create/Get/Delete + `MaterializeDue`; HTTP under `/wallet/recurring`.
- Auto-materialize (owner decision): a rule is an explicit opt-in, so it creates
  the transaction automatically (editable, tagged `recurrente`) — completing stats
  without the monthly friction of a confirm step. Materialization runs on the
  dashboard load (`DashboardPresenter`), best-effort; the dedicated
  `/wallet/recurring` page manages rules.
- **Concurrency guard**: two parallel loads (e.g. React StrictMode double-mount)
  raced and duplicated the boundary occurrence. Fixed with an atomic compare-and-swap
  (`advanceLastRunIfBefore`: `UPDATE ... WHERE last_run_date < date`), so each
  occurrence is claimed by exactly one run. Regression-tested with concurrent
  `execute` calls.

## D2: "Today" Command Center (in progress — June 2026)

Reality check on opening D2: most of the original D2 description was already
shipped. `/home` is a command center (quick task capture, stats, cross-domain
signals, wallet snapshot, weekly trend, operational rhythm, and a ritual card
linking to `/review`); `/review` is a full evening-close ritual (task queue,
mood/energy check-in, wallet queue, insights queue, decisions) with
**server-backed data via CQBus**; the chat panel is **already global** — outside a
domain it falls back to a user-selectable agent, so the "Ctrl+K is a no-op" gap is
closed. Home and review were also migrated off React Query to the presenter pattern.

So D2's real remainder is four small slices, shipped one at a time (owner reviews
each before the next):

### R1. Ritual ceremony-state to the server (multi-device) — SHIPPED June 2026

The review's note + acknowledged signals + watched categories used to live in
`localStorage`; the underlying data (tasks, mood, transactions) was already
server-backed, so "review from the phone at night, the desktop in the morning"
lost the ceremony state. Now persisted server-side. PRODUCT_ANALYSIS P5.

- Backend (CQBus): `daily_review_state` table (forward-only migration `0010`,
  unique on `(owner_user_id, date)` for the upsert) + `DailyReviewStateRepository`
  port and Drizzle impl; `GetDailyReviewStateQuery` / `SaveDailyReviewStateCommand`
  handlers registered in `TaskModuleRuntime`; thin `GET/PUT /tasks/review/state`
  controller routes.
- Web (the mirror): `getReviewState`/`saveReviewState` on `TasksGateway` + HTTP
  impl, `GetDailyReviewState` / `SaveDailyReviewState` use cases registered in the
  web `TasksModule`. `ReviewPresenter` hydrates from the server (concurrently with
  the data load), keeps the in-memory state driving the UI, and flushes edits with
  a short debounce (note typing coalesces into one write) plus a flush on `stop()`;
  `HomePresenter` reads the same state so the morning ritual card reflects what the
  evening close wrote on another device. `daily-review-storage.ts` kept only its
  pure helpers (`createEmptyDailyReviewState`, `mergePersistedDailyReviewState`) —
  the localStorage path is gone.

### R2. Morning-plan ritual — SHIPPED June 2026

Asymmetry: the evening has an active close ritual; the morning is a passive
dashboard. Add a light "plan the day" step (confirm yesterday's carry-overs, pick
today's focus) — the morning mirror of the close.

- Reused the R1 `daily_review_state` row: added `focus_task_id` and `planned_at`
  (forward-only migration `0011`) instead of opening a second ritual table.
- Backend keeps the same CQBus state surface (`GetDailyReviewStateQuery` /
  `SaveDailyReviewStateCommand`) and validates that a saved focus task belongs
  to the authenticated user. `CarryOverAllPendingCommand` remains the action for
  confirming yesterday's pending tasks into today.
- Web: `/home` now renders an active morning plan inside the daily ritual card:
  lazy-loads yesterday's pending review, can carry all open tasks into today,
  lets the owner choose today's focus, and persists the plan server-side. The
  evening `/review` summary reads the same state and shows the morning focus.

### R3. Proactive agent brief on the synthesis surfaces — PAUSED (2026-06-25)

The chat is available on `/home` and `/review` but passive. Open it with a one-line
day brief (tasks, spend alerts, streaks) so the agent participates in the *decide*
stage. Folds in part of D6.

**Paused 2026-06-25:** there is no LLM provider configured in DEV or PROD today, so
the agent layer this slice activates is dead end-to-end. Even a determinístic brief
would ship into a surface whose chat can't respond, so R3 waits until a provider
exists. Revisit when the owner wires an LLM provider (local or hosted).

### R4. Unify /home + /review into one "Today" surface — NOT STARTED (maybe skip)

The literal D2 ask: one daily surface with morning/evening phases by time of day.
Highest refactor/risk and arguably low value — two bridged screens already work.
Last, and revisit whether it's worth doing after R1–R3.

## D3: Activate Work / Projects (COMPLETE — June 2026)

Owner-directed promotion of D3 from candidate to active work. Same discipline as the
Health and D1 series: one full-stack slice at a time, each shipping before the next.
The owner's primary driver is **tracking hours per project to report to bosses /
clients**; the structural prerequisite is resolving the Tasks ↔ Projects boundary so
the two don't cannibalize.

**Gate resolved (owner decisions, 2026-06-25).** These are settled and not to be
re-litigated when implementing:

1. **A Project is an aggregate that owns `outcome + next action + focus` — NOT a new
   task store.** Tasks remain the single store of work items. A `Project` is the
   direction layer; `Task` gains an optional `projectId`.
2. **The board per project is a *view* over existing Tasks (`GROUP BY` status /
   column), not a separate set of cards.** "Today" stays the daily-execution lens;
   the board is the per-project direction lens over the *same* tasks. This preserves
   the moat (agent + cross-domain already hang off `tasks.task.*`).
3. **Time tracking is manual entry first** (Wallet philosophy), timer is a later
   enhancement. A `TimeEntry` points at a **Project**, with an optional `taskId` —
   but logging will be **mostly at the project level**. The report (by
   project / week / client) is the feature; capture is just its input.
4. **Projects have a `kind: work | personal`.** Hours reporting (with a
   `client`/recipient) applies to **work** projects; personal projects use
   outcome + board without billing. The board itself is available to both.
5. **Clients should become a selectable catalog, not free text.** D3a shipped with
   `Project.client` as optional text to keep the first slice small; before hours
   reporting, promote this into a Projects-owned Client ABM / selector so reports
   can group reliably by client. Existing text clients should be preserved and
   migrated forward, not discarded.
6. **Task creation/editing should offer a Project selector.** This is a Projects/Tasks
   UX refinement over the D3a link, not a new work-item store: creating a work/project
   task can attach the existing task to a project and initial board column.

### D3a. Project aggregate + task linking + board — SHIPPED (2026-06-25)

Resolves the gate in code and gives the structure everything else hangs off.

- **Backend (CQBus + new aggregate):** `Project` rich entity (`kind`, `outcome`,
  `nextAction`, `focus`, optional `client`, lifecycle/status) + repository port +
  Drizzle impl + the three synchronized DB changes + fake + test. New
  forward-only migration. Create/Get/List/Update + Archive use cases; thin HTTP
  controller under `/projects` (or a `work` module — decide module home at
  implementation, consistent with AGENTS.md module rules).
- **Task ↔ Project link:** add optional `projectId` (and a board `status`/column) to
  the Task aggregate via a forward-only migration; a use case to assign/unassign a
  task to a project. No data loss for existing tasks (nullable, defaults preserved).
- **Web (the mirror):** `ProjectsGateway` + HTTP impl, web use cases registered in a
  `ProjectsModule`; a projects list screen and a per-project board presenter that
  renders the project's tasks grouped by column (reuses the Tasks read paths — no
  new card entity). Presenter unit tests, React-free.

### D3b. Client catalog + time tracking + hours report — SHIPPED (2026-06-26)

The owner's core value: log hours and report them to bosses / clients.

- **Backend:** `Client` and `TimeEntry` aggregates with repositories, Drizzle impls,
  fakes, and owner-scoped queries. `Project.clientId` is nullable and backed by the
  catalog while preserving legacy free-text `client`.
- **Migration:** forward-only migration `0013_eager_sister_grimm.sql` creates clients
  and time entries, adds `projects.client_id`, backfills clients from legacy text,
  and links projects to the catalog.
- **CQBus/API:** client CRUD, time-entry log/list/update/delete, and
  `GetProjectHoursReportQuery` grouped by client / project / week. Use cases validate
  ownership of projects, tasks, and client ids.
- **Web:** client manager, time tracking, and hours report presenters; project forms
  use the client selector. Landing marks Projects active.

### D3c. Task ↔ Project selector — SHIPPED (2026-06-26)

The other half of the Projects/Tasks boundary UX: Tasks remains the single work-item
store, but task creation and task detail editing can attach a task to an existing
active project.

- **Backend/shared:** task create/update schemas accept optional `projectId` (and
  tolerate `boardStatus` for existing board semantics). Tasks CQBus handlers validate
  the project against the authenticated owner before persisting. Assigning from Tasks
  defaults the board column to `backlog`; board movement remains owned by the project
  board.
- **Web:** quick capture loads active projects and sends the selected `projectId`.
  The task detail panel exposes the same project selector and updates the selected
  task through `UpdateTask`, then reloads the dashboard store.
- **Tests:** shared schema coverage, Tasks app handler ownership tests, presenter
  tests for both create/edit surfaces, and Projects+Tasks API E2E coverage including
  cross-user isolation.

### D3d. Cross-domain — SHIPPED (2026-06-28)

What keeps Work from being a siloed module competing with Toggl/Linear. Both slices
shipped after D3a/D3b/D3c:

- **`projects→wallet`: SHIPPED (2026-06-28).** Projects carry optional
  `hourlyRate` + `rateCurrency`; the hours report computes expected income per
  row and totals by currency (never mixing ARS/USD). The web report shows those
  values with `.font-data` and deep-links to Wallet's transaction form pre-filled
  as income. It is suggest-not-write: Wallet never auto-creates the transaction.
- **`time→review`: SHIPPED (2026-06-27).** Home morning plan and Review evening close
  reuse `GetProjectHoursReportQuery` for `fromDate=toDate=today`, showing total
  project time plus a short per-project list. No backend query or migration was
  added for this slice.

## D4: Life Goals (COMPLETE for D4a-D4d — June 2026)

Owner-directed promotion of D4 from candidate to active work. The product risk is
explicit: a strategic goals layer is useless if it becomes decorative. The first
slice therefore shipped with one real cross-module metric, not a manual-only shell.

**Decisions closed for D4 (2026-06-28).**

1. **New module: `objectives`.** It does not reuse Health `Goal`; Health goals remain
   health-scoped. UI labels are Spanish ("Metas" / "Objetivos de vida").
2. **Explicit periods.** Objectives store `periodStart` and `periodEnd` ISO dates,
   rather than deriving quarter/year from labels.
3. **Progress is read-time web composition.** The Objectives backend persists the
   objective and metric binding only. Progress is computed by the web presenter via
   a typed metric-source catalog over the frontend CQBus.
4. **Metric bindings are typed.** `metricSource + target + unit` lives on the
   aggregate. Current sources support `manual`, `projects_hours`,
   `tasks_completed`, per-currency `wallet_savings`, and targeted
   `health_habit_completions`; wallet sources must stay per-currency and never
   sum ARS+USD.

### D4a. Objective aggregate + CRUD + one live metric — SHIPPED (2026-06-29)

- **Backend/shared:** `Objective` rich entity (`periodStart`, `periodEnd`,
  `metricSource`, `target`, `unit`, nullable `manualValue`, lifecycle status) +
  repository port, Drizzle implementation, fake repository, CQBus
  Create/Get/List/Update/Archive handlers, thin HTTP controller under
  `/api/v1/objectives`, shared Zod schemas/types, new `objectives` schema, and
  forward-only migration `0015_odd_brother_voodoo.sql`.
- **Web:** `ObjectivesModule` mirrors the backend use cases; `/objectives` shows
  Metas with progress bars, Spanish labels, period presets (current quarter/year),
  create/edit/archive flows, and a typed metric-source catalog. `manual` progress
  reads `manualValue`; `projects_hours` calls Projects `GetHoursReport` for the
  objective period and converts `totalMinutes / 60`.
- **Tests:** backend domain/use-case unit tests, shared schema tests, Drizzle repo
  integration, Objectives API e2e with cross-user isolation, web domain/handler/
  HTTP gateway/presenter tests, and `createAppCore` wiring coverage.

### D4b. Expand metric-source catalog + achieved lifecycle — SHIPPED (2026-06-29)

- **Achieved lifecycle:** new CQBus command + `POST /api/v1/objectives/:id/achieve`
  marks objectives `active→achieved` idempotently with auth-derived ownership.
  The web presenter detects `current >= target` lazily on `/objectives` load,
  persists best-effort, and updates local state without recursive reloads.
- **Metric catalog:** added `tasks_completed`, composed read-time in the web
  presenter through Tasks `GetTasksByDomain({ from, to })` and summed across
  domains for the objective period. It is non-monetary, so no currency dimension
  or migration was needed.
- **Wallet savings metric:** added `wallet_savings` with explicit objective
  currency persisted on the aggregate (forward-only migration `0016`). The web
  presenter composes Wallet `GetSavings`, filters by objective currency, and sums
  savings contributions only — not account balances or income. The form and cards
  explain the source and link to `/wallet/savings`.
- **Accepted limitation (owner decision — option A, 2026-06-29):** unlike the other
  four sources, `wallet_savings` is **not period-scoped** — it sums the *current*
  amount of matching savings goals regardless of the objective's
  `periodStart`/`periodEnd`, so the period is informational for this source. Kept
  as-is on purpose: savings are inherently cumulative, and period-scoping would need
  a contributions-in-range query that does not exist today. The form/card hint
  discloses that progress comes from Ahorros in that currency.
- **Deferred:** broader Health metric sources remain future slices.

### D4c. Surface objectives on /home — SHIPPED (2026-06-29)

Home now shows active objectives as the daily "north": the presenter loads
Objectives through the frontend CQBus, computes read-time progress through the
same metric-source catalog as `/objectives`, and exposes a compact card with up to
three active objectives plus a link to Metas.

- **Simple next action:** each visible objective can create a task scheduled for
  today with the title `Avanzar en: <meta>`. This is intentionally not a persisted
  objective↔task relationship.
- **Deferred:** strong objective-to-task/focus linking and broader Health metric
  sources.

### D4d. Health habit completions metric source — SHIPPED (2026-06-29)

Objectives can now bind progress to one specific Health habit through
`health_habit_completions` + `metricTargetId`. Health exposes
`GET /api/v1/health/habits/:id/completions?from&to`, scoped to the authenticated
owner, and the web metric catalog calls it for the objective period. The
Objectives backend still only persists the binding; it does not read Health.

- **Web form:** selecting "Hábito (Health)" shows active habits from Health and
  saves the selected habit id. Progress cards show completions as `veces`.
- **Persistence:** new nullable `metric_target_id` column on
  `objectives.objectives` via migration `0017_lame_sue_storm.sql`.
- **Tests:** shared schema coverage, Health query unit/e2e, Objectives domain/
  use-case/integration/e2e, web Health gateway/handler, and Objectives presenter.

## D5: Universal Inbox + Triage (PLANNED — June 2026)

Owner-directed promotion of D5 from candidate to a planned execution. Same discipline
as the prior tracks: one full-stack slice at a time, each shipping before the next.
D5 is an **enhancer, not a headline** — it repairs the *capture* stage by driving its
cost to zero: dump anything now, decide where it belongs later (*triage*), instead of
forcing a module choice at capture time. It feeds every module without adding a
siloed surface.

**Decisions to lock before implementing (gate).** Settled, not to be re-litigated:

1. **New lightweight module `inbox`, aggregate `InboxItem`.** Raw captured text +
   optional note, `status` (`pending | triaged | discarded`), `routedTo` (which
   module it became — audit only, not an FK), timestamps. Passes the New Domain Gate.
   UI label Spanish ("Bandeja" / "Inbox").
2. **Capture is frictionless and untyped.** One text field, no required type or
   destination — the point is to *not* decide at capture time. Type/destination is
   chosen at triage.
3. **Boundary vs. existing quick-adds (anti-cannibalization).** The per-module
   quick-adds (Tasks quick capture, Wallet quick expense) stay for when the owner
   already knows the type; the inbox is for *undecided* captures. Document this so the
   two don't compete — same discipline as the Tasks↔Projects gate.
4. **Triage routes via deep-link/prefill to existing create surfaces — the inbox
   never writes into other modules.** It is not a write-hub: triaging opens the target
   module's create form pre-filled with the captured text (suggest-not-write, the
   D1a/D4 pattern), then marks the item `triaged` with `routedTo`. The inbox owns only
   `InboxItem`s; no backend coupling to other modules' write paths, no cross-module FK.
5. **No LLM.** Triage is manual (the owner picks the destination). An optional
   deterministic keyword heuristic may *suggest* a likely destination (D5c), reusing
   the D1a `payment-intent.ts` heuristic style. LLM-powered auto-classification waits
   for a provider — it folds in with R3/D6 when one exists.

### D5a. Inbox capture + queue — NOT STARTED

The capture half — useful on its own (a frictionless "dump anything" list) before
routing exists.

- **Backend (new module):** `InboxItem` rich entity (text, note, status, routedTo,
  timestamps) + repository port + Drizzle impl + the three synchronized DB changes +
  fake + test; new forward-only migration; new `inbox` schema. CQBus
  Capture/List/Get/Discard handlers; thin HTTP controller under `/api/v1/inbox`;
  owner-scoped with cross-user isolation. Register in `DefaultCoreConfiguration` +
  `DefaultRepositories`.
- **Shared:** Zod schemas + cross-package types in `@vdp/shared` (status enum,
  capture/list shapes).
- **Web (the mirror):** `InboxGateway` + HTTP impl, use cases in an `InboxModule`
  registered in `createAppCore`; an `/inbox` screen with a frictionless capture box
  (one field, submit) and a pending list with discard. Page registered in
  `navigation.ts`. Presenter + ViewModel + React-free tests.

### D5b. Triage routing — NOT STARTED

Route a pending item into the right module via prefilled deep-links; mark it triaged.

- **Web:** each pending item exposes triage actions to the highest-value destinations
  — Task (Tasks quick-add prefilled with the text), Wallet expense/income (the
  existing `/wallet/transactions/new?type&amount&currency&description` prefill), and
  Health (note/symptom). Taking an action marks the item `triaged` with `routedTo` and
  navigates to the prefilled create surface (suggest-not-write; if the owner abandons
  the form the item stays triaged and is reopenable).
- **Prefill gaps:** Tasks and Wallet already accept prefill params; add narrow,
  reusable prefill params to any destination create surface that lacks them (e.g.
  Health). Projects/Objectives destinations can follow if they prove valuable.
- **Tests:** presenter tests for the routing actions + status transition; assert the
  deep-link targets/params.

### D5c. Heuristic triage suggestion (deterministic, no LLM) — NOT STARTED (optional)

Suggest the likely destination per pending item without an LLM, so triage is one
click.

- A keyword heuristic (money words → Wallet, payment-intent verbs → task/expense,
  symptom/body words → Health) suggests a destination chip per item, reusing the
  `wallet/services/payment-intent.ts` style. Pure, deterministic, unit-tested. The
  owner accepts the suggestion or picks another — it never auto-routes.
- **Deferred to a provider:** LLM-powered classification (free-text understanding,
  higher accuracy) waits until an LLM provider exists, folding in with R3/D6.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
