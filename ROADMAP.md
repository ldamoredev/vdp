# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture, module rules, agent rules, safety, and verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, and private medical records section; medical has no agent by design |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Order Of Work

1. ~~Recovery: restore local confidence, CI, and manual app verification.~~ Done.
2. ~~Tasks production-readiness: validate the module end to end before real daily use.~~ Done (June 2026 hardening).
3. ~~Auth hardening: strengthen the already-complete Auth V1 flow under production-like conditions.~~ Done code-side (rate limiting + failure auditing); the owner production smoke remains.
4. Expansion: Health shipped as the habits slice, deepened with H1 counters, H2 goals, H3 private medical records, and P1 flexible cadence. **Paused after P1 (June 2026)** while the Architecture Track finishes; Phase 4 remaining proposals are P2 → P3.
5. **Architecture Track (ACTIVE)**: frontend mirror (Vite SPA + presenters + CQBus + Core) and CQBus on the api. Full analysis and decisions in [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md). A5 frontend migration is complete; **A6 is owner-led**: migrate the remaining old API services/controllers to the new CQBus style, then delete `ServiceProvider`.

## Architecture Track (ACTIVE — June 2026)

Owner-approved in the June 2026 architecture session. Source of truth for rationale,
decisions, and detailed plans: [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md).
One phase per work session unless noted. Phase 4 below is paused until this track completes.
A6 is owner-led: the owner will migrate the remaining old API services/controllers
to CQBus style.

Confirmed decisions (summary): Vite SPA replacing Next.js (served as static build by
Fastify, single Render service, Vercel retired); presenters (Humble Object) + CQBus +
`core/` composition root mirroring the backend; React Query removed; `FetchHttpClient`
over `abstract-http-client`; `react-presenter` used as published (under Vite its
optional react-navigation `require` is harmless at runtime — no custom publish).

### A6. CQBus on the api — OWNER-LED

The owner is taking this phase. Coexistence with `ServiceProvider`, identity
middleware first (makes the auth-context rule structural), health converted
first, then logging/OTel middlewares, then auth → tasks → wallet;
`ServiceProvider` deleted; `create-service-api` updated to its final CQBus form.
Open product decision for this phase: `RequestAuditLogger` as a bus middleware.
Details: analysis doc §11.

## Phase 4: Health Deepening

**PAUSED after P1 (June 2026): the Architecture Track above runs first; resume with P2.**

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

Implementation notes (blueprint for the next session — mirror the H1 counters
implementation, it is the closest template):

- Table `health.goals`: id, owner_user_id (FK users, cascade), title varchar(120),
  notes text null, target_date date, status varchar(12) default 'active'
  (active/done/dropped), deadline_notified varchar(4) default 'none'
  (none/t7/t1 — the lazy-detection dedupe stage), completed_at timestamptz null,
  created_at, updated_at. Add to drizzle schema + migration + test-database
  SETUP_SQL + truncate list.
- Rich `Goal` entity: `complete()`, `drop()`, `markDeadlineNotified(stage)`.
- Services: CreateGoal (target date must be in the future), GetGoalsOverview
  (computes daysLeft; lazy deadline detection: if active and daysLeft <= 1 and
  stage < t1 → notify t1; else if daysLeft <= 7 and stage < t7 → notify t7;
  persist the stage BEFORE emitting, same as counters), CompleteGoal, DropGoal,
  and GraduateGoal (completes the goal AND creates a habit from a given name,
  composing the existing CreateHabit service — returns both).
- Event `health.goal.deadline_approaching` {userId, goalId, title, targetDate,
  daysLeft}; handled in tasks `CrossDomainEventHandlers`: warning insight +
  review task (P2 at t7, P3 at t1) scheduled today, domain 'health'.
- Routes under `/api/v1/health/goals`: GET list, POST create, POST :id/complete,
  POST :id/drop, POST :id/graduate {habitName, emoji?}.
- Agent tools: list_goals, create_goal, complete_goal (offer graduation in the
  prompt rules: when a goal completes, suggest the habit conversion).
- Frontend: GoalsSection on /health below counters (create form: title + date;
  rows with daysLeft in `.font-data`, overdue state, complete/drop buttons;
  completing offers an inline "convertir en hábito" affordance that calls
  graduate). Selectors: sortGoals (closest deadline first, overdue on top),
  goalUrgencyLabel.
- Tests mirror counters: entity + services unit (fake repo, fake timers),
  CrossDomainEventHandlers cases, e2e in HealthAPI.e2e.test.ts (CRUD, deadline
  signal via dedupe-column reset trick, graduation creates the habit, isolation).

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

### P2. Daily mood/energy check-in wired into the ritual (proposal)

One tap (1–5) inside the existing daily review ritual — no new screen. The
research case: mood-vs-activity correlation is the killer feature of Daylio
and Bearable, but they can't see your task load. VDP can: weekly insight
correlating mood with task carry-over and habit completion ("tus semanas de
ánimo ≤2 coinciden con arrastre >40%"). Cheap to capture, compounds with every
other domain, and gives the end-of-day ritual a reason to be opened daily.

### P3. Weight tracking with trend (proposal)

The single most-tracked body metric and the natural companion of diet/gym goals
(H2): a goal can carry an optional target weight. Scope: one number per day max,
sparkline trend on the habits screen, mono `font-data` rendering. Explicitly not
a metrics platform — one metric, until proven insufficient.

Suggested order from here: ~~H1~~ → ~~H2~~ → ~~H3~~ → ~~P1~~ → P2 → P3. H1 shipped
first because it is the owner's most-lived use case with the smallest scope and
the strongest cross-domain payoff; H3 shipped as an owner-directed continuation;
P1 shipped next because graduated gym/diet goals needed weekly cadence to become
honest habits.

## Data Constraint

Production data can be discarded until the Tasks production-readiness checkpoint is complete. Once Tasks starts being used for real personal work, stop assuming task data is disposable and reassess migration/backfill discipline.
