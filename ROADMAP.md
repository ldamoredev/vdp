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
4. Expansion: Health shipped as the habits slice, deepened with H1 counters, H2 goals, H3 private medical records, P1 flexible cadence, P2 daily mood/energy check-ins, and P3 weight tracking.
5. ~~**Architecture Track**: frontend mirror (Vite SPA + presenters + CQBus + Core) and CQBus on the api.~~ Done (June 2026). Full analysis and decisions in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md). The A5 frontend migration shipped and A6 closed: Auth/Health/Tasks/Wallet expose HTTP through CQBus, no domain depends on `ServiceProvider`, and the legacy bridge — plus its now-dead `registerServices` lifecycle hook — was deleted from the common core.
6. **Product Directions** (June 2026): six candidate directions recorded below. **D1 (cross-domain densification) is in progress** — D1a (`tasks→wallet`) shipped; see the D1 execution section below.

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

## Phase 4: Health Deepening

Resumed after the Architecture Track pause and completed with P3 shipped in June 2026.

Source: the owner's real prior usage in Notion (user stories H1–H3, all shipped)
plus researched proposals (P1–P3). One feature at a time, in the order below;
each one ships only when the previous one is in real daily use. Every feature
stays inside the existing `health` module (services + tables + frontend feature
components), so the New Domain Gate applies as a per-feature checklist, not a
new module.

### H1. Abstinence counters — "days since" (user story) — SHIPPED June 2026

> "Como había dejado de fumar, tenía metas tipo contador que llevaba la cuenta
> de días desde que dejé."

The inverse of a habit: instead of marking every day, a counter runs up from a
start date ("Sin fumar — día 94").

- Scope: counter = name + start date + optional estimated daily cost (ARS).
  "Recaí" resets the counter but preserves attempt history (current attempt vs
  best attempt). No daily interaction required — that is the point.
- Milestones (1/7/30/100/365 days) reuse the `health.habit.milestone` →
  achievement-insight pattern. Detection without a scheduler: evaluate on
  overview load, deduped with a `last_milestone_notified` column.
- Cross-domain (the differentiator): with a daily cost set, the counter computes
  money not spent and surfaces it as a periodic insight ("94 días sin fumar ≈
  $X no gastados"). Insight only in v1 — no automatic Wallet writes.
- Research note: day counter + money saved + milestone badges is the standard
  core of dedicated quit apps (Kwit, Quit Tracker); VDP composes it with the
  wallet instead of a fake in-app piggy bank.

### H2. Goals with deadlines (user story) — SHIPPED June 2026

> "Tenía metas con una fecha límite: empezar el gym, empezar dieta."

One-shot outcomes with a target date — distinct from habits (recurring) and
tasks (today-sized).

- Scope: goal = title + target date + status (active / done / dropped) + optional
  notes. Deliberately NOT project management: no subtasks, no progress percent.
- Cross-domain: deadline approaching (T-7 and T-1) with the goal still active →
  review task + warning insight. Same no-scheduler constraint as H1: evaluate on
  overview load with a dedupe column.
- Graduation loop (signature move): completing a goal offers converting it into
  a habit — "Empezar el gym" done → habit "Gimnasio" created with one tap. A goal
  is how a habit gets started; a habit is how a goal stays won.

Implementation is now the CQBus reference for Health: `Goal` owns the deadline
state, `GetGoalsOverviewQuery` performs lazy deadline detection and persists the
dedupe stage before emitting, `HealthController` routes through `bus.execute`,
and the web `GoalsPresenter` owns labels, busy state, and the goal-to-habit
graduation flow.

### H3. Medical records — fichas médicas (user story) — SHIPPED June 2026

> "Tenía documentos y fichas médicas, debe haber una sección para eso."

The Health medical section: consultas, estudios, vacunas, recetas.

- Shipped scope: structured records inside Health — type (consulta / estudio / vacuna /
  receta / otro), date, professional, specialty, free notes — plus file
  attachments. Attachments are the first blob storage in the stack, implemented
  through a `FileStorage` port backed by Postgres `BYTEA` for the personal-scale
  v0; the seam keeps an object-storage swap possible later.
- Upload safety: one file per request, 10MB max, content-sniffed allowlist
  (PDF, JPEG, PNG, WEBP, HEIC), sanitized display filenames, and no `storageRef`
  on the API wire.
- Privacy rule: medical records are the most sensitive data in the system. They
  are NOT exposed through agent tools by default (tool results travel to the LLM
  provider); revisit only with an explicit owner decision.
- Cross-domain: a record marked "pendiente" (estudio a realizar, orden vigente)
  can create a task; full appointment tracking stays out of scope until needed.

### P1. Flexible habit cadence — x times per week (proposal) — SHIPPED June 2026

Daily-only was too narrow. Real habits often aren't: gym 3x/week is the
canonical case — and now the H2 graduation loop can produce that honestly.
Weekly-frequency scheduling is also the most common gap between basic and
serious habit trackers (HabitNow, Streaks).

Shipped scope: per-habit cadence `daily` or `x per week`; weekly target stored
on the habit; overview exposes current-period progress (`2/3 esta semana`) and
daily/weekly streaks; streak math generalizes to consecutive *weeks* that met
the target. The week-met/week-missed events reuse the existing milestone and
streak-broken signals with a day/week unit so Tasks insights and recovery tasks
word them correctly. The Health UI supports cadence on habit creation and goal
graduation; the Health agent can create daily or weekly habits.

### P2. Daily mood/energy check-in wired into the ritual (proposal) — SHIPPED June 2026

Shipped scope: one row per user/day in Health for mood (1–5) and energy (1–5),
captured inside the existing `/review` ritual — no new screen. The weekly
summary combines check-in averages with Health habit completion, and the ritual
UI correlates low mood with Tasks carry-over when the 7-day rate is high.

### P3. Weight tracking with trend (proposal) — SHIPPED June 2026

The single most-tracked body metric and the natural companion of diet/gym goals
(H2): a goal can carry an optional target weight. Shipped scope: one weight
entry per day max (upsert/correction), 30-day trend summary, sparkline on the
Health screen, mono `font-data` rendering, and optional `targetWeightKg` on
deadline goals. Explicitly not a metrics platform — one metric, until proven
insufficient.

Historical shipping order: ~~H1~~ → ~~H2~~ → ~~H3~~ → ~~P1~~ → ~~P2~~ → ~~P3~~. H1 shipped
first because it is the owner's most-lived use case with the smallest scope and
the strongest cross-domain payoff; H3 shipped as an owner-directed continuation;
P1 shipped next because graduated gym/diet goals needed weekly cadence to become
honest habits; P2 shipped next because it strengthens the daily review loop with
a cheap signal that compounds across Tasks and Health; P3 shipped last because
it adds the smallest useful body metric without opening a broader metrics
platform.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
