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
5. **Architecture Track (ACTIVE)**: frontend mirror (Vite SPA + presenters + CQBus + Core) and CQBus on the api. Full analysis and decisions in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md). A5 frontend migration is complete; **A6 is almost closed**: Auth/Health/Tasks/Wallet now expose HTTP through CQBus and Wallet no longer uses `ServiceProvider`; the remaining work is moving the Tasks service collaborators off `ServiceProvider` and deleting `ServiceProvider`.

## Architecture Track (ACTIVE — June 2026)

Owner-approved in the June 2026 architecture session. Source of truth for rationale,
decisions, and detailed plans: [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md).
One phase per work session unless noted. Phase 4 is complete; A6 is the only
open architecture item.

Confirmed decisions (summary): Vite SPA replacing Next.js (served as static build by
Fastify, single service, Vercel retired); presenters (Humble Object) + CQBus +
`core/` composition root mirroring the backend; React Query removed from active
domains; `FetchHttpClient` over `abstract-http-client`; `react-presenter` used
as published (under Vite its optional react-navigation `require` is harmless at
runtime — no custom publish). On the api side, new active-domain work is
CQBus-first: `app/{UseCase}{Command|Query}.ts` + handler, runtime registration,
thin HTTP controllers executing the bus with auth-derived `ExecutionContext`.

### A6. CQBus on the api — IN PROGRESS

Shipped so far:

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
- The web side remains the mirror: `core/domain` ports, `core/app`
  commands/queries, `Http*Gateway`, presenter + ViewModel + humble view.

Remaining before A6 closes:

- Move the remaining Tasks service collaborators (`EmbedTask`,
  `FindSimilarTasks`, `DetectRepeatPattern`, stats/review helpers, and insight
  rebuilders) out of `ServiceProvider` and into explicit/lazy runtime
  dependencies.
- Delete `ServiceProvider` from `Core`, `ModuleContext`, `BaseModule`, agents,
  tests, and `server/src/modules/common/base/services/ServiceProvider.ts`.
- Delete or rewrite the remaining legacy Tasks `services/` registration tests
  once the bridge is gone; keep pure service classes only when they are real
  reusable collaborators behind handlers.
- Keep `create-service-api`, `create-service-web`, `create-presenter-web`, and
  `create-agent-tool` skills aligned with this CQBus form.

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
