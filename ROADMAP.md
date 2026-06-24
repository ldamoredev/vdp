# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture, module rules, agent rules, safety, and verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, weight trend, daily mood/energy check-ins, and private medical records section; medical has no agent by design |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Order Of Work

1. ~~Recovery: restore local confidence, CI, and manual app verification.~~ Done.
2. ~~Tasks production-readiness: validate the module end to end before real daily use.~~ Done (June 2026 hardening).
3. ~~Auth hardening: strengthen the already-complete Auth V1 flow under production-like conditions.~~ Done code-side (rate limiting + failure auditing); the owner production smoke remains.
4. ~~Expansion: Health shipped as the habits slice, deepened with H1 counters, H2 goals, H3 private medical records, P1 flexible cadence, P2 daily mood/energy check-ins, and P3 weight tracking.~~ Done
5. ~~**Architecture Track**: frontend mirror (Vite SPA + presenters + CQBus + Core) and CQBus on the api.~~ Done (June 2026). Full analysis and decisions in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md). Done
6. **Product Directions** (June 2026): six candidate directions recorded below. **D1 (cross-domain densification) shipped** — all three slices; see the D1 execution section. **D2 ("Today" command center) in progress** — found mostly already built; remainder (R1–R4) in the D2 execution section below.

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

### R2. Morning-plan ritual — NOT STARTED

Asymmetry: the evening has an active close ritual; the morning is a passive
dashboard. Add a light "plan the day" step (confirm yesterday's carry-overs, pick
today's focus) — the morning mirror of the close.

### R3. Proactive agent brief on the synthesis surfaces — NOT STARTED

The chat is available on `/home` and `/review` but passive. Open it with a one-line
day brief (tasks, spend alerts, streaks) so the agent participates in the *decide*
stage. Folds in part of D6.

### R4. Unify /home + /review into one "Today" surface — NOT STARTED (maybe skip)

The literal D2 ask: one daily surface with morning/evening phases by time of day.
Highest refactor/risk and arguably low value — two bridged screens already work.
Last, and revisit whether it's worth doing after R1–R3.

## Architecture Track (COMPLETE — June 2026)

Owner-approved in the June 2026 architecture session. Source of truth for rationale,
decisions, and detailed plans: [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md).
One phase per work session unless noted. Phase 4 and the full Architecture Track
(A1 Vite port → A6 CQBus on the api) are complete; there is no open architecture item.

Confirmed decisions (summary): Vite SPA replacing Next.js (served as static build by
Fastify, single service, Vercel retired); presenters (Humble Object) + CQBus +
`core/` composition root mirroring the backend; React Query removed from active
domains; `FetchHttpClient` over `abstract-http-client`; `react-presenter` used
as published (under Vite its optional react-navigation `require` is harmless at
runtime — no custom publish). On the api side, new active-domain work is
CQBus-first: `app/{UseCase}{Command|Query}.ts` + handler, runtime registration,
thin HTTP controllers executing the bus with auth-derived `ExecutionContext`.

### A6. CQBus on the api — SHIPPED June 2026

Shipped:

- `Core` owns a backend `CQBus` and registers an auth middleware that can derive
  identity from `AuthContextStorage`.
- Auth, Health, Tasks, and Wallet expose their active HTTP surface through
  `Command`/`Query` classes in `server/src/modules/{domain}/app/`, handlers
  registered in `{Domain}ModuleRuntime.registerHandlers()`, and controllers
  that call `bus.execute(..., executionContextFromAuth(request.auth))`.
- Auth still uses its existing service classes as reusable collaborators behind
  CQBus handlers; the HTTP controller no longer calls those services directly.
- Agent tools for active domains dispatch the same commands/queries from the
  current auth context; tool input still never carries `userId`.
- Wallet intelligence tools now fetch Tasks context through
  `GetTasksSnapshotQuery` on CQBus instead of `ServiceProvider`, and Wallet
  CRUD/read/stat use-case logic now lives directly in its `app/`
  Command/Query handlers. `wallet/services/` keeps only event/insight
  collaborators.
- Tasks CRUD/read/review/stat use-case logic now lives directly in its `app/`
  Command/Query handlers. `TaskModuleRuntime` builds explicit/lazy
  collaborators (`EmbedTask`, `FindSimilarTasks`, `DetectRepeatPattern`,
  `RecommendationEngine`, `RebuildStreaks`) without `ServiceProvider`, and
  cross-domain events create recovery/review tasks by dispatching
  `CreateTaskCommand` through CQBus.
- The web side remains the mirror: `core/domain` ports, `core/app`
  commands/queries, `Http*Gateway`, presenter + ViewModel + humble view.
- Final cleanup (June 2026): `ServiceProvider` and `ServiceResolver` are
  deleted; `Core`, `ModuleContext`, and `BaseModule` no longer carry a
  `services` registry; and the `registerServices()` lifecycle hook — dead once
  every collaborator moved into CQBus handler wiring — was removed from
  `BaseModule` and all module/runtime classes. `bootstrap()` now runs
  `registerHandlers → registerEventHandlers → registerAgents`. The
  `create-service-api`, `create-service-web`, `create-presenter-web`, and
  `create-agent-tool` skills are aligned with this final CQBus form.

Lesson carried into the skills: with CQBus the handler is the single
transport-agnostic entry point shared by HTTP controllers and agent tools, so
cross-cutting rules that must hold for every caller (e.g. medical upload
content-sniffing and size caps) live in the handler, not the controller. The
controller stays a thin adapter that builds the command and executes the bus.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
