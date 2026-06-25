# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture, module rules, agent rules, safety, and verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, weight trend, daily mood/energy check-ins, and private medical records section; medical has no agent by design |
| Projects | ✅ | ✅ | — | Active D3a direction layer; Tasks remain the only work-item store |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Order Of Work

1. ~~Recovery: restore local confidence, CI, and manual app verification.~~ Done.
2. ~~Tasks production-readiness: validate the module end to end before real daily use.~~ Done (June 2026 hardening).
3. ~~Auth hardening: strengthen the already-complete Auth V1 flow under production-like conditions.~~ Done code-side (rate limiting + failure auditing); the owner production smoke remains.
4. ~~Expansion: Health shipped as the habits slice, deepened with H1 counters, H2 goals, H3 private medical records, P1 flexible cadence, P2 daily mood/energy check-ins, and P3 weight tracking.~~ Done
5. ~~**Architecture Track**: frontend mirror (Vite SPA + presenters + CQBus + Core) and CQBus on the api.~~ Done (June 2026). Full analysis and decisions in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md). Done
6. **Product Directions** (June 2026): six candidate directions recorded below. **D1 (cross-domain densification) shipped** — all three slices; see the D1 execution section. **D2 ("Today" command center) in progress** — found mostly already built; remainder (R1–R4) in the D2 execution section below. **D3a (Project aggregate + task linking + board) shipped**; D3b/D3c remain unstarted.

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

**Status (June 2026): in progress.** The boundary gate is resolved (a Project owns
an outcome, not a separate task store) and the work is sliced in the "D3: Activate
Work / Projects" execution section below.

### D4. Life Goals (Goals 2.0) — *decide, top layer* — strategic layer

Health already has deadline goals + goal→habit graduation. Lift that primitive to a
**cross-module layer**: quarterly/annual objectives pulling metrics from
health/wallet/tasks — the "north" the day-to-day ladders up to. Cheap (reuses an
existing primitive); risk is it turns decorative if not wired to real metrics.

### D5. Universal inbox + triage — *capture* — enhancer

Capture anything from anywhere (thought, expense, symptom, person) → triage into the
right module. Net-new but cheap, feeds every module. A multiplier on the capture
habit, not a headline direction.

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
  `?registrar-gasto=<title>` opening the quick-add pre-filled with the task title.
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

## D3: Activate Work / Projects (in progress — June 2026)

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

### D3b. Time tracking + hours report — NOT STARTED

The owner's core value: log hours and report them to bosses / clients.

- **Backend:** `TimeEntry` aggregate (project, optional task, date, minutes, note) +
  repository + Drizzle impl + three synchronized DB changes + fake + test; new
  forward-only migration. Log/Edit/Delete + a report query
  (`GetProjectHoursReportQuery`) aggregating by project / week, scoped to the
  authenticated owner. Currency-safe is N/A here, but keep minutes integer-safe.
- **Client catalog prerequisite:** add a Projects-owned Client entity/ABM and replace
  free-text project client entry with a selector. Preserve/migrate existing text
  clients forward into the catalog. Reports should group by client identity, not
  spelling.
- **Web:** manual log entry on the project (and optionally on a task), plus a report
  view per project / per week / per client, with an export (copy or CSV) for sending
  to a boss / client. Project create/edit uses the client selector; Task create/edit
  exposes a Project selector for work/project tasks. Presenter + ViewModel + unit
  tests.

### D3c. Cross-domain — NOT STARTED

What keeps Work from being a siloed module competing with Toggl/Linear. Each is a
candidate slice, sequenced after D3a/D3b land:

- **`projects→wallet`:** a work/freelance project's tracked hours × rate → expected
  income, or register the income on invoicing. The reaction (a wallet entry) lives
  in Wallet's cross-domain handlers, per the AGENTS.md "the module that owns the
  reaction owns the subscriber" rule.
- **`time→review`:** surface "today you spent Xh on Project Y" in the evening close /
  morning plan, feeding the *learn* stage of the loop.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
