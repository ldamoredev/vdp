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
| Inbox | ✅ | ✅ | — | Active (D5 closed): frictionless capture + pending queue (Bandeja) + triage routing to Tasks/Wallet via prefilled deep-links + LLM-powered smart triage suggestion (D5c, never auto-routes) |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Order Of Work

1. ~~Recovery: restore local confidence, CI, and manual app verification.~~ Done.
2. ~~Tasks production-readiness: validate the module end to end before real daily use.~~ Done (June 2026 hardening).
3. ~~Auth hardening: strengthen the already-complete Auth V1 flow under production-like conditions.~~ Done code-side (rate limiting + failure auditing); the owner production smoke remains.
4. ~~Expansion: Health shipped as the habits slice, deepened with H1 counters, H2 goals, H3 private medical records, P1 flexible cadence, P2 daily mood/energy check-ins, and P3 weight tracking.~~ Done
5. ~~**Architecture Track**: frontend mirror (Vite SPA + presenters + CQBus + Core) and CQBus on the api.~~ Done (June 2026). Full analysis and decisions in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md). Done
6. **Product Directions** (June 2026): six candidate directions recorded below. **D1 (cross-domain densification) shipped** — all three slices; see the D1 execution section. **D2 ("Today" command center) in progress** — found mostly already built; remainder (R1–R4) in the D2 execution section below. **D3 (Work / Projects) shipped** — D3a project aggregate + task linking + board, D3b client catalog + time tracking + hours report, D3c Task ↔ Project selector, and D3d cross-domain slices. **D4 (Life Goals) shipped for the planned D4a–D4d scope** — Objective CRUD plus manual, Projects-hours, completed-tasks, Wallet-savings, and specific Health-habit progress, achieved detection, and Home surface. **D5 (Universal Inbox + triage): CLOSED** — D5a (capture + queue) + D5b (triage routing to Tasks/Wallet via prefilled deep-links) shipped; D5c (smart suggestion) parked behind an LLM provider. Slice breakdown in the D5 execution section below.

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

**Status (June 2026): CLOSED.** D5a + D5b shipped (capture + queue + triage routing).
D5c (smart suggestion) was deliberately not pursued — the deterministic heuristic is
low value next to an LLM classifier, so it is parked with D6 behind an LLM provider.
Decisions and slice breakdown in the "D5: Universal Inbox + Triage" execution section
below.

### D6. Proactive agent (not a prettier chat) — *decide + learn* — enhancer

The agent layer is excellent but reactive and per-domain. Make it proactive: morning
brief, weekly prep, "you left X pending". Pairs naturally with D2 (it is the brain of
the command center). Respects the medical-no-LLM rule.

**Status (June 2026): in progress — D6a shipped.** Builds directly on R3a/R3b
(the brief mechanism) and D5c (the lazy-once-per-period pattern). Gate decisions and
slice breakdown in the "D6: Proactive Agent" execution section below.

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

### R3. Proactive agent brief on the synthesis surfaces — R3a + R3b shipped (2026-06-30)

The chat is available on `/home` and `/review` but passive: it opens as an empty box.
Seed it with a proactive day brief (tasks, focus, spend alerts, streaks, objective
progress) so the agent participates in the *decide* stage. Folds in part of D6.

**Unblocked 2026-06-29.** R3 was paused (2026-06-25) because no LLM provider was
configured, so the chat the brief leans on was dead end-to-end. An LLM provider is now
being wired (Groq free tier to start, likely Claude later — it's an `AGENT_PROVIDER`
config switch, no code change). With a live chat, R3 becomes worth shipping.

**Gate decisions (settled, not to be re-litigated):**

1. **Deterministic brief, live chat.** The brief *content* is composed
   deterministically from existing cross-domain queries — reliable, instant, free, and
   it degrades gracefully if the LLM rate-limits (Groq free tier will). The LLM unlock
   is the *conversation*: the brief seeds the chat's opening message and the owner can
   ask follow-ups and act through the agent's existing tools. (R3b can later let the
   LLM author the brief itself.)
2. **Per-surface phrasing.** `/home` is forward-looking (today's focus, carry-overs,
   signals to act on); `/review` is backward-looking (today's close: completed, spend,
   streaks, what's still pending).
3. **Medical stays out.** The brief composes only non-medical signals and the agent has
   no medical tools — no regression of the medical-no-LLM rule.
4. **Reuse, don't rebuild.** `/home` and `/review` already compute most of this
   (cross-domain signals, queues, stats, focus, objective progress). The brief composes
   those existing read-time results into a short message — same presenter-composition
   pattern, no new heavy queries.

### R3a. Deterministic day brief seeded into the chat — SHIPPED (2026-06-30)

Make the synthesis-surface chat proactive instead of an empty box.

- **Web only, no backend change** — composes from the `HomeViewModel`/`ReviewViewModel`
  each presenter already builds, so no new query was added. `home-agent-brief.ts` /
  `review-agent-brief.ts` are pure functions (`buildHomeAgentBrief`,
  `buildReviewAgentBrief`) producing a ≈3–6 line Spanish brief, phrased per surface:
  `/home` forward-looking (today's focus or carry-overs, top signals, an in-progress
  objective, wallet/insight counts to watch), `/review` backward-looking (close
  progress, undecided tasks, wallet signals, mood/energy).
- **Handoff to the shell:** `ChatPanel` lives outside the Home/Review presenter tree
  (sibling to `<Outlet/>` in `domain-layout.tsx`), so the brief crosses via a small
  global store — `synthesis-brief-store.ts`, same `createStore` pattern as the
  existing `chat-store.ts`. Each presenter writes its brief on `refresh()` and clears
  it on `stop()`; `ChatPanel` reads `useSynthesisBrief(pathname)` and renders it as a
  synthetic opening `MessageBubble` (`/home` and `/review` are not in the domain
  registry, so the chat there already falls back to a user-selectable domain agent —
  the brief seeds whichever one is selected). The synthetic message is render-only:
  never pushed into `chat.messages` state, never sent to the backend — no agent/prompt
  change, so follow-ups are unaffected.
- **Tests:** pure unit tests for both brief composers (incl. a guard that nothing
  medical/private ever appears, structurally guaranteed since neither ViewModel
  carries that data), plus presenter-level tests asserting the store is seeded on load
  and cleared on `stop()`. Full web suite green (541 tests) and `tsc --noEmit` clean.
- **Verified:** automated (typecheck + unit suite). Live-browser confirmation (open
  `/home`/`/review` with Groq live, see the brief render, send a follow-up) is the
  remaining manual step — needs local infra + an owner login this session
  deliberately didn't touch.

### R3b. LLM-authored brief + actionable follow-ups — SHIPPED for the agreed scope (2026-06-30)

Richer version once R3a is live and the provider is stable. Scoped down with the owner
before implementing: **Tasks agent only** (not Wallet/Health — smaller surface, and
Tasks already has the tools a daily brief needs), **manual trigger** (a button, not an
automatic call on every `/home`/`/review` open — keeps Groq free-tier quota under the
owner's control), and **no new tools this slice** (reschedule/register-expense already
worked via R3a's live chat; a `capture_to_inbox` tool is deferred to D6).

- **Backend:** one new `## Brief del día` section in
  `tasks/infrastructure/agent/system-prompt.ts`, next to the existing "Review de fin de
  día" section — no new tool, no new CQBus query, no migration. It instructs the agent
  to compose a natural, prioritized 3-6 line brief (not a raw data dump) using tools it
  already has: `get_today_stats` + `get_insights` for the start-of-day framing,
  `get_end_of_day_review` + `get_insights` for end-of-day, `get_wallet_context` only
  when something financial is worth flagging.
- **Web:** `apps/web/src/ui/chat/use-chat-stream.ts` exposes a new `sendMessage(text,
  agentEndpoint, conversationId)`, extracted from `handleSubmit` (which is now a thin
  wrapper) so a fixed string can be sent without going through the input box. A
  "✨ Redactar con IA" button renders under the R3a template bubble — only when the
  selected agent is Tasks — and sends a fixed, surface-specific prompt (forward framing
  on `/home`, backward on `/review`) through the same chat pipeline as any typed
  message. No new persistence path: the click is a normal chat turn, so R3a's instant
  template is what's seen until the owner opts in, and stays the fallback if Groq
  errors or rate-limits (existing `sendError` UI).
- **Tests:** `use-chat-stream.ts` is a pure extraction (existing
  `chat-stream-reducer.test.ts` covers the shared event handling); the system-prompt
  change has no dedicated test, consistent with the repo's existing convention for that
  file (`TasksSystemPrompt.test.ts` only guards the per-chat date-rebuild rule, not
  prompt copy). Full web suite green (541 tests), both `apps/web` and `server`
  `tsc --noEmit` clean.
- **Verified:** automated only (typecheck + unit suite). Live confirmation (click the
  button on `/home` and `/review`, read the authored brief, confirm the button is
  absent on Wallet/Health) is the remaining manual step.
- **Deferred to D6:** automatic/silent triggering, Wallet/Health brief support, and the
  `capture_to_inbox` tool for follow-up actions.

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

## D5: Universal Inbox + Triage (COMPLETE — June 2026)

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

### D5a. Inbox capture + queue — SHIPPED (2026-06-29)

The capture half — useful on its own (a frictionless "dump anything" list) before
routing exists.

- **Backend (new module `inbox`):** `InboxItem` rich entity (text, note, status,
  `routedTo`, `triagedAt`, timestamps — the `routedTo`/`triagedAt` columns ship now,
  unused, so D5b adds the triage command without a second migration) + repository
  port + Drizzle impl + the three synchronized DB changes + fake; new `inbox` schema
  and forward-only migration `0018_windy_tinkerer.sql`. CQBus Capture/List/Get/Discard
  handlers; thin HTTP controller under `/api/v1/inbox`; owner-scoped with cross-user
  isolation. Registered in `DefaultCoreConfiguration` + `DefaultRepositories`.
- **Shared:** Zod schemas + cross-package types in `@vdp/shared` (status enum,
  capture shape).
- **Web (the mirror):** `InboxGateway` + HTTP impl, `CaptureInboxItem` /
  `ListInboxItems` / `DiscardInboxItem` use cases in an `InboxModule` registered in
  `createAppCore`; an `/inbox` ("Bandeja") screen with a frictionless capture box
  (one textarea, submit) and a pending list with discard. Page registered in
  `navigation.ts` + `routes.tsx`. Presenter + ViewModel + React-free tests.
- **Tests:** backend domain/use-case unit, Drizzle integration, Inbox API e2e with
  cross-user isolation; web domain/handler/HTTP gateway/presenter, and
  `createAppCore` wiring coverage.

### D5b. Triage routing — SHIPPED (2026-06-29)

Route a pending item into the right module via prefilled deep-links; mark it triaged.

- **Backend:** `InboxItem.triage(routedTo)` (pending→triaged, stamps `routedTo` +
  `triagedAt` — no migration; D5a reserved the columns). `TriageInboxItemCommand` +
  `POST /api/v1/inbox/:id/triage`, owner-scoped with cross-user isolation. Shared
  `triageInboxItemSchema`.
- **Web:** each pending item shows triage buttons per destination. Clicking runs
  `TriageInboxItem(id, routedTo)` (marks triaged + reloads) and then navigates to the
  prefilled create surface. Two destinations shipped: **Tarea**
  (`/tasks?capturar=<text>`) and **Gasto**
  (`/wallet/transactions/new?type=expense&description=<text>`). Suggest-not-write — the
  inbox never creates the target entity; it routes and the owner confirms.
- **Prefill:** Wallet already accepted prefill params (D1a/D4b
  `parseWalletTransactionPrefill`). Added a narrow `?capturar=<text>` prefill to the
  Tasks quick-capture (optional `initialTitle` on `QuickCapturePresenter`). Health and
  Projects/Objectives destinations are deferred — Health has no clean free-text capture
  surface (medical stays private), so it needs a dedicated surface before routing there.
- **Tests:** domain triage transition, use-case + e2e with cross-user isolation, web
  presenter triage targets/transition, and the Tasks quick-capture prefill.

### D5c. Smart triage suggestion — SHIPPED (2026-06-30)

D5 was closed without D5c. The deterministic keyword heuristic (money words → Wallet,
payment-intent verbs → task/expense, symptom/body words → Health, reusing the
`wallet/services/payment-intent.ts` style) is low value next to a real classifier and
would mostly be thrown away once an LLM exists. So smart triage was parked with D6 and
R3: when an LLM provider is wired, the agent classifies the captured text and suggests
a destination (the owner still confirms — never auto-routes).

Unblocked by the same provider as R3 (Groq, `AGENT_PROVIDER=openai-compatible`,
confirmed live end-to-end through R3a/R3b). Picked up ahead of D6 as the smaller,
self-contained slice (Inbox only, vs. D6's broader proactive-agent surface).

- **Backend:** `InboxItem` gains `suggestedDestination` + `suggestedAt` (both nullable,
  forward-only migration `0019_wandering_leper_queen.sql`, also added to the hand-rolled
  e2e test-DB bootstrap in `test/test-database.ts` — the third synchronized-DB-change
  spot this repo has, easy to miss). `suggestedAt` is a separate column from
  `suggestedDestination` on purpose: a `null` destination is ambiguous between "not
  classified yet" and "classified, nothing matched," so the timestamp alone marks
  "already tried" and gates re-classification.
- **Classification is a plain one-shot function, not a new agent.** New
  `inbox/services/classify-destination.ts` calls `AgentProvider.generate()` directly —
  no tools, no conversation, no `BaseAgent`/chat-loop/persistence — with a short system
  prompt asking for exactly one word (`tasks`/`wallet`/`none`), parsed defensively
  (substring match) and wrapped in try/catch so a Groq error or rate-limit never breaks
  the Bandeja (`destination: null`, suggestion just doesn't show). This is the first
  one-shot (non-chat) LLM call pattern in the codebase.
- **`SuggestInboxItemDestinationCommand`** (new CQBus command, `POST
  /api/v1/inbox/:id/suggest`) is idempotent: a no-op once `suggestedAt` is set or the
  item left `pending`, so the LLM is called at most once per captured item, ever.
- **Trigger (owner decision):** automatic, lazy on load — `InboxPresenter` requests a
  suggestion for any pending item missing one as part of `load()`, mirroring
  `ObjectivesPresenter`'s lazy "achieved" detection (compute, persist best-effort, skip
  next time). Differs from R3b's manual-button choice because a suggestion is cached
  forever per item, while R3b's brief has no caching — same cost-control instinct,
  different mechanism because the shapes differ.
- **Never auto-routes:** the suggestion only highlights the matching triage button
  (`btn-primary` instead of `btn-secondary`); routing still requires the owner's
  explicit click through the existing `TriageInboxItem` flow, unchanged.
- **Tests:** domain guard (`suggestDestination()` only applies to `pending` items),
  `classify-destination` unit tests (label parsing + never-throws), handler idempotency
  test with a stub `AgentProvider`, e2e route + cross-user isolation (with a
  deterministic stub provider swapped into the inbox e2e `TestCoreConfiguration` so the
  suite doesn't depend on a real LLM), and a web presenter test for the lazy-trigger/
  skip-if-suggested/silent-on-failure behavor. Full backend suite green (416 unit + 65
  integration + 124 e2e) and web suite green (543 tests); both `apps/web` and `server`
  `tsc --noEmit` clean.
- **Verified:** automated only. Manual confirmation (capture a task-shaped and a
  money-shaped note, reload the Bandeja, see the matching button highlight without
  clicking anything) is the remaining step.

## D6: Proactive Agent (in progress — June 2026)

Owner-directed continuation straight from R3b/D5c: the LLM provider is live and proven,
so D6 turns the agent from reactive to proactive. The literal ROADMAP ask — morning
brief, weekly prep, "you left X pending" — is now scoped against what actually exists
in the codebase, not against a generic SaaS notion of "proactive."

**Gate decisions (settled 2026-06-30, not to be re-litigated when implementing):**

1. **No new scheduler/cron infrastructure.** The server has none today — not even for
   Wallet's recurring transactions, which D1c deliberately solved with a lazy
   materialize-on-load instead of a background job. There is also no push/email
   channel: the only "live while disconnected" delivery is SSE, which requires an open
   connection. A real cron job would therefore have nowhere to deliver its output
   except "wait for the next time the owner opens the app" — functionally identical to
   triggering lazily on that next open. So D6 reuses the **lazy, once-per-period,
   persisted** pattern already proven in D5c (Inbox suggestions) and D1c (recurring
   transactions): compute on the first relevant load of a new period, persist so it
   isn't recomputed, skip on every later load that period. If the owner doesn't open
   the app, nothing fires — same as today.
2. **The brief mechanism doesn't change, only its trigger.** R3b already gave Tasks an
   agent that authors a brief from its own tools given a fixed prompt. D6a's only job
   is to fire that same prompt **automatically** instead of waiting for the
   "✨ Redactar con IA" click — the button stays as the manual override/regenerate path.
3. **Per-day ritual state is the right home for the gating flag**, not a new table.
   `daily_review_state` (R1) already tracks per-`(owner_user_id, date)` ritual
   timestamps (`openedAt`, `completedAt`, `plannedAt` from R2) — morning/evening brief
   "already requested today" timestamps belong there, mirroring exactly how R2 added
   `focusTaskId`/`plannedAt` to the same row instead of opening a second table.
4. **"You left X pending" reuses the existing TaskInsight system**, not a new
   notification channel. `TaskInsightFactory` already has event-driven, persisted,
   SSE-pushed insights for exactly this shape (`taskStuck` — postponed N times;
   `tasksOverloaded` — high carry-over rate). D6c's job is to fold these into the
   now-automatic brief's voice, not invent a parallel mechanism.
5. **Medical stays out**, same rule as every prior track.

### D6a. Morning/evening brief becomes automatic (once per day) — SHIPPED (2026-06-30)

Promotes R3b from a manual click to "already there" the first time the owner opens
`/home` or `/review` each day, while staying inside Groq's free-tier rate limits by
firing at most once per surface per day.

- **Backend:** `morning_brief_requested_at` / `evening_brief_requested_at` (nullable
  timestamps) added to `daily_review_state` — forward-only migration
  `0020_abnormal_purple_man.sql`, mirroring R2's `planned_at` addition to the same
  table (also added to the e2e test-DB bootstrap SQL, the third sync point D5c
  already flagged). **Not** written through the existing full-state
  `SaveDailyReviewState` path — that always round-trips the *entire* ritual record
  from a single owning presenter (Home/Review), and `ChatPanel` is a second,
  independent writer that could otherwise clobber `note`/`acknowledgedSignalIds`/
  `focusTaskId` with stale values. Instead, a new narrow, idempotent command —
  `MarkDailyReviewBriefRequestedCommand` / `POST /tasks/review/brief-requested` —
  upserts via `COALESCE(existing, NOW())` so it only ever sets its own timestamp
  once, never touching the rest of the row. Mirrors the
  `TriageInboxItem`/`SuggestInboxItemDestination` "small, targeted mutation" style
  from D5b/D5c rather than the "send the whole blob" style.
- **Web:** `synthesisBriefStore` (R3a) gained `homeBriefRequested` /
  `reviewBriefRequested`, **defaulting to `true`** — until `HomePresenter`/
  `ReviewPresenter` prove otherwise for *today* from their already-loaded
  `reviewState`, `ChatPanel` must assume the brief was already requested, so it can
  never auto-fire before real data has loaded. The actual gate decision was pulled
  out into a pure, directly-tested function (`ui/chat/auto-brief-gate.ts`,
  `shouldAutoFireBrief`) rather than left inline in the component, since mounting
  `ChatPanel` for a test would need CoreProvider/router/Tasks-events/network mocks
  for marginal benefit.
- **`ChatPanel`** fires the existing `HOME_BRIEF_PROMPT`/`REVIEW_BRIEF_PROMPT` (R3b)
  automatically — same Tasks-only, same `stream.sendMessage` pipeline — runs even
  while the panel is visually closed (the component is always mounted, just
  returns `null`), so the conversation is already there by the time the owner opens
  it. A `useRef` same-render guard protects against React dev-mode's double-invoke;
  the persisted flag is the real once-per-day guard. The manual "✨ Redactar con IA"
  button (R3b) is unchanged — it's the regenerate/"wasn't on Tasks the first time
  today" fallback.
- No change to the brief-authoring system prompt itself (R3b's `## Brief del día`
  section is reused as-is).
- **Tests:** backend repository/handler idempotency tests, e2e route + cross-user
  isolation; web `daily-review-storage` field round-trip, `HomePresenter`/
  `ReviewPresenter` tests asserting the store flag reflects `reviewState`, and a
  dedicated `auto-brief-gate.test.ts` covering every gate branch. Full backend
  suite green (418 unit + 65 integration + 126 e2e) and web suite green (559
  tests); both `apps/web` and `server` `tsc --noEmit` clean.
- **Verified:** automated only. Manual confirmation (open `/home` for the first
  time today, see the brief arrive without clicking; reopen later the same day and
  confirm no second Groq call; same independently for `/review`) is the remaining
  step.

### D6b. Weekly prep — NOT STARTED

A week-ahead (Monday morning) or week-review (Sunday evening) framing, same mechanism
as D6a but weekly cadence and reusing the Tasks agent's existing `get_weekly_summary`
tool (already described in `system-prompt.ts`'s "## Resumen semanal" section) instead
of `get_today_stats`/`get_end_of_day_review`.

- New `weekly_prep_requested_at` (or a `(year, week)` key) likely needs its own small
  state, since `daily_review_state` is keyed per-day, not per-week — exact shape to
  settle at implementation time, but same "persist once per period" gate as D6a.
- A third trigger phrase + a small addition to `## Brief del día` (or a sibling
  section) telling the agent to compose the weekly version from `get_weekly_summary`
  when asked.

### D6c. "You left X pending" folded into the brief — NOT STARTED

Makes the now-automatic brief actively call out aged, un-acted-on items across domains
instead of only reading like a status readout.

- Read-time only: have the brief-authoring instructions explicitly reference
  `get_insights` results (already surfaced — `taskStuck`/`tasksOverloaded` cover most
  of "you left X pending" today) and phrase them as a nudge, not just list them.
- Evaluate whether any *new* insight types are worth adding (e.g. an aged,
  uncategorized Wallet transaction) only after D6a/D6b ship and the owner has lived
  with the automatic brief — avoid inventing nudges nobody asked for.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
