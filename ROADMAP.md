# VDP Roadmap

Forward-looking only. Shipped work is not narrated here — check `git log`/`git blame`
for how and when something landed. For setup and commands see
[`README.md`](./README.md). For architecture, module rules, agent rules, safety, and
verification guidance see [`AGENTS.md`](./AGENTS.md). For product identity, decision
criteria, and what NOT to build see [`PRODUCT_ANALYSIS.md`](./PRODUCT_ANALYSIS.md).

## Product north star

> VDP is a personal execution system: it turns objectives into daily action and
> real data (money, habits, hours) into evidence of progress.

Objectives + Tasks are the spine; Wallet/Health/Projects are evidence and signals;
Inbox is the funnel; Home/Review are the ritual. Depth before breadth: phases 1-4
add no new modules. Every new feature is weighed against the criteria in
`PRODUCT_ANALYSIS.md` §Criteria.

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, weight trend, daily mood/energy check-ins, and private medical records section; medical has no agent by design |
| Projects | ✅ | ✅ | — | Active direction, board, client catalog, time tracking, hours report, and expected-income link to Wallet |
| Objectives | ✅ | ✅ | — | Active Life Goals layer: quarterly/annual objectives with achieved detection plus manual, Projects-hours, completed-tasks, Wallet-savings, and Health-habit-completions read-time progress |
| Inbox | ✅ | ✅ | — | Active: frictionless capture + pending queue (Bandeja) + triage routing to Tasks/Wallet via prefilled deep-links + LLM-powered smart triage suggestion (never auto-routes) |
| People | — | Disabled demo page | — | Inactive (deferred indefinitely; see PRODUCT_ANALYSIS) |
| Work | — | Disabled demo page | — | Inactive (blocked on F1.5 boundary doc) |
| Study | — | Disabled demo page | — | Inactive |

The agent layer (Tasks) is proactive: an auto-authored daily brief and weekly prep seed
the chat on `/home`/`/review`, and stuck/overloaded-task insights are folded into that
brief as concrete nudges. Medical stays off the LLM by design.

LLM provider: OpenCode Zen (`openai-compatible`), live in prod since 2026-07-06 with
`mimo-v2.5-free` as the interim model, chat gated to the owner. Model re-evaluation is
F1.6. Eval harness: `scripts/agent-model-eval.mjs`.

## Status

The mid-2026 track (D1–D6) and the Superadmin layer (R10) shipped; commit history is
the record. On 2026-07-06 the next track was scoped with the owner from the unified
product analysis: **Phase 1 below is the active backlog**, in order. One feature per
session, through the per-feature gate, then STOP and summarize.

Explicitly deferred from the Superadmin layer, to be scoped only when a concrete need
appears: user management (list/disable users), per-user chat toggles, audit UI, and
any further privileged actions beyond the two shipped flags.

## Phase 1 — Strengthen the core (active)

No new modules. Recommended order: F1.1 → F1.2 → F1.3 → F1.4 → F1.5; F1.6 whenever
the owner unblocks billing. Each item is a self-contained session.

### F1.1 Verified backup + per-domain export

**Why:** VDP's value is the longitudinal accumulation of real data (financial and
medical) in a single Supabase DB. Data loss kills the product. This is the number one
trust feature.

**Scope:**
- Backup script (`pg_dump`) against the prod DB, runnable by the owner (owner-run,
  like deploys — never from a local session; the session delivers the script +
  runbook, it does not run the backup). Simple retention (last N dumps).
- Restore verification: a documented procedure, exercised once end-to-end against a
  disposable local Postgres.
- Per-active-domain JSON export (tasks, wallet, health incl. medical, projects,
  objectives, inbox), owner-scoped, via script or authenticated endpoint — decide at
  session start; a script is enough if it avoids new HTTP surface.

**Out of scope:** backups UI, scheduled automatic backups (no cron by rule),
selective import/restore.

**Done when:** a full restore from a dump has been verified locally and every domain
exports valid JSON. Documented as a runbook under `docs/`.

### F1.2 Owner-usage instrumentation

**Why:** Phase 2+ decisions (what to deepen, whether Objectives deserves an agent,
whether mobile is real friction) are currently made blind. Two weeks of own-usage
data beat any analysis.

**Scope:**
- Minimal table (e.g. `core.usage_events`): `surface`, `action`, `occurred_on`
  (date), counter with upsert — one row per day per surface+action. The three
  synchronized DB changes from AGENTS.md §Database apply.
- Server-side recording where the actions already flow (HTTP middleware mapping API
  route prefix → domain, plus targeted hooks in key action handlers: task completed,
  expense logged, habit completed, objective viewed). Fire-and-forget with `.catch`
  — instrumentation must never break a request.
- Reading: a SQL query is enough. No UI, no dashboard, no external analytics.

**Out of scope:** granular client-side tracking, session replay, performance
metrics, a usage dashboard.

**Done when:** a query shows visits/actions per day per domain and one week of real
data has accumulated without errors in prod logs.

### F1.3 Objectives — deadline-approaching signal

**Why:** Objectives is the strategic layer and today it never interrupts the day. It
is the highest-leverage pending cross-domain signal and follows an already-documented
pattern.

**Scope:**
- Follow the H2 pattern from AGENTS.md §Insights (lazy detection on overview load):
  persisted dedupe column on the `objectives` schema (e.g.
  `last_deadline_notified`), saved BEFORE emitting; after long gaps emit only the
  highest crossed threshold.
- Event `objectives.objective.deadline_approaching` (payload: objective id, title,
  days remaining, current progress vs. target) → handler in Tasks
  (`CrossDomainEventHandlers`) creates a decision task + warning insight, same
  pattern as `health.goal.deadline_approaching`.
- Thresholds to confirm with the owner at session start (proposal: 14 days for
  quarterly objectives, 30 for annual, only when progress < 100%).
- Tests on both sides + an e2e booting Objectives + Tasks (pattern:
  `health/__tests__/e2e/TestCoreConfiguration.ts`).

**Done when:** an active objective near its `periodEnd` generates (exactly once) the
decision task and the insight, verified by e2e and a manual smoke.

### F1.4 Objectives visible on /home

**Why:** "what objective is today serving?" — the strategic layer must be visible
where the day gets planned.

**Scope:**
- Card on `/home` with active objectives: name, progress (reuse the Objectives
  presenter's read-time computation), days remaining, and a one-tap action
  (deep-link to task creation with a pre-filled title, `?capturar=` pattern).
- Note: `/home` is a legacy screen (React Query; see AGENTS.md §Frontend
  Architecture — migration status). Do NOT migrate the whole screen as part of this
  item; the card may follow the local legacy pattern or consume the core if natural.
  Keep the scope small and explicit.

**Out of scope:** home redesign, migrating home to the presenter pattern, filtering
tasks by objective (no task↔objective relation exists and none is created here).

**Done when:** active objectives with their progress show on `/home` with a one-tap
action, with no regression on the rest of the screen.

### F1.5 Document the Tasks / Projects / Work boundary

**Why:** `Tasks.domain=work`, Projects, and the future Work module overlap
conceptually. Without a written boundary the next feature lands in the wrong module.
This blocks any future consideration of Work.

**Scope:** a documentation session, not a code session. Canonical table in AGENTS.md
("when it goes in Tasks with domain=work / when in Projects / what would justify a
Work module") + reconcile `docs/architecture/ARCHITECTURE.md` if drifted. AGENTS.md
is the source of truth (CLAUDE.md rule).

**Done when:** the table is in AGENTS.md and no other doc contradicts it.

### F1.6 Paid LLM model (blocked on billing — owner)

**Why:** `mimo-v2.5-free` is interim (~3s/call, "tuteo" register, free tier). The
paid candidates in the OpenCode Go plan are blocked by `CreditsError`.

**Scope:** once the owner resolves billing: run
`scripts/agent-model-eval.mjs eval kimi-k2.7-code minimax-m3 deepseek-v4-flash
qwen3.6-plus`, compare against the mimo baseline (5/5, ~2.9s), pick by correct
tool-calling first and latency second, update `OPENAI_COMPAT_MODEL` on Railway and
smoke in prod. If the winner uses "tuteo", adjusting the system prompt builders for
"voseo" is a separate, optional item.

## Later phases (scope with the owner on arrival)

- **Phase 2 — Deepen existing modules:** Objectives weekly retro (trend vs. target,
  last 4 weeks); Health weekly summary (mood × completions × weight, one-tap
  actions); a real command palette on `Ctrl+K` (capture→inbox, jump, complete, log —
  today it only toggles the chat). Priorities driven by F1.2 data.
- **Phase 3 — Cross-domain intelligence:** composed read-time dashboard (Objectives ×
  Wallet × Health × Projects, one-tap action per tile); auto-generated quarter/year
  in review. Rule: an insight without an attached decision does not get built. At
  the third composed surface, evaluate moving read-time composition out of the
  presenter into a read-model layer (not before).
- **Phase 4 — Agents (prerequisite: stable paid model in prod):** Objectives agent
  (weekly gap-analysis + suggest corrective task with HITL; never auto-achieve or
  auto-archive); formalize the write gradient in AGENTS.md (autonomous narration /
  writes with confirmation / never deletes nor medical); verify tool-call auditing;
  a cross-domain brief orchestrator only if the domain agents see daily use, forced
  to one concrete recommendation per turn.
- **Phase 5 — Optional expansion:** People as a thin slice with a single signal
  ("no contact with X in N weeks → suggest task") only after validating the loop
  manually; Study/Work only with a concrete daily-loop case and F1.5 resolved.

## Parked

### R4. Unify /home + /review into one "Today" surface — PARKED (confirmed 2026-07-06)

`/home` and `/review` already cover the morning-plan / evening-close split as two
separate, working screens with shared server-backed ritual state
(`daily_review_state`); merging them is a refactor of things that already work, not a
capability gap. Highest risk/effort-to-value ratio of anything left. Revisit only if
having two screens instead of one becomes an actual daily friction point — don't do it
speculatively.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
