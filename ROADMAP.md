# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture, module rules, agent rules, safety, and verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active as a thin slice: daily habits only (streaks + cross-domain signals) |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

## Order Of Work

1. ~~Recovery: restore local confidence, CI, and manual app verification.~~ Done.
2. ~~Tasks production-readiness: validate the module end to end before real daily use.~~ Done (June 2026 hardening).
3. ~~Auth hardening: strengthen the already-complete Auth V1 flow under production-like conditions.~~ Done code-side (rate limiting + failure auditing); the owner production smoke remains.
4. Expansion: Health shipped as the habits slice. Next: deepen the slice (or add cross-domain signals) before opening another domain.

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

- Align CI with Node 24 and the pnpm version pinned in `package.json`.
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

Health shipped (June 2026) as a deliberately thin slice through the full New Domain Gate: daily habits with per-day completion, streaks, archive, agent tools, and two cross-domain signals into Tasks (`health.habit.streak_broken` → recovery task + insight, `health.habit.milestone` → achievement insight). Metrics, medications, appointments, and body tracking stay out until the habits slice proves real daily use.

For any further expansion (deepening Health or opening People/Work/Study), satisfy the New Domain Gate in `AGENTS.md`. At minimum: backend module registration, migration, entities, repositories, services, HTTP controllers using auth context, cross-user isolation tests, shared contracts, frontend feature module, navigation registration, and agent tooling only after the auth-context rules are satisfied.

Done when: the new surface meets the Tasks reference shape and is verified through local checks, CI, and a manual owner smoke.

## Phase 4: Health Deepening

Source: the owner's real prior usage in Notion (user stories H1–H3) plus researched
proposals (P1–P3). One feature at a time, in the order below; each one ships only
when the previous one is in real daily use. Every feature stays inside the existing
`health` module (services + tables + frontend feature components), so the New Domain
Gate applies as a per-feature checklist, not a new module.

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

### H3. Medical records — fichas médicas (user story)

> "Tenía documentos y fichas médicas, debe haber una sección para eso."

The personal medical archive: consultas, estudios, vacunas, recetas.

- Scope v0 (no new infra): structured records — type (consulta / estudio /
  vacuna / receta / otro), date, professional, specialty, free notes, and
  external links (Drive/iCloud) for the actual documents.
- Scope v1 (separate decision): file upload. This is the first blob storage in
  the stack — Supabase Storage is the natural candidate given production already
  runs on Supabase. Do not start v1 until v0 proves the section gets used.
- Privacy rule: medical records are the most sensitive data in the system. They
  are NOT exposed through agent tools by default (tool results travel to the LLM
  provider); revisit only with an explicit owner decision.
- Cross-domain: a record marked "pendiente" (estudio a realizar, orden vigente)
  can create a task; full appointment tracking stays out of scope until needed.

### P1. Flexible habit cadence — x times per week (proposal)

Today's slice is daily-only. Real habits often aren't: gym 3x/week is the
canonical case — and it is exactly what the H2 graduation loop will produce.
Weekly-frequency scheduling is also the most common gap between basic and
serious habit trackers (HabitNow, Streaks). Scope: per-habit cadence `daily`
or `x per week`; streak math generalizes to consecutive *weeks* that met the
target. The week-met/week-missed events reuse the existing milestone and
streak-broken signals.

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

Suggested order: ~~H1~~ → ~~H2~~ → P1 → H3 (v0) → P2 → P3. H1 shipped first because
it is the owner's most-lived use case with the smallest scope and the strongest
cross-domain payoff; P1 right after H2 because graduated gym/diet goals need
weekly cadence to become honest habits.

## Data Constraint

Production data can be discarded until the Tasks production-readiness checkpoint is complete. Once Tasks starts being used for real personal work, stop assuming task data is disposable and reassess migration/backfill discipline.
