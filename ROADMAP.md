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

No new modules. Each item is a self-contained implementation session run per
`docs/WORKFLOW.md` (feature branch + PR). One PR in flight at a time.

Assignments (also the opencode bake-off, see WORKFLOW §opencode model policy):

| Item | Agent | Status |
|---|---|---|
| F1.2 | Codex GPT 5.5 | shipped (usage_events) |
| F1.3 | opencode Kimi K2.7-code | shipped (deadline signal) |
| F1.4 | opencode GLM 5.2 | shipped (objectives on /home) |
| F1.5 | Codex GPT 5.5 | active — Tasks/Projects/Work boundary doc |
| F1.6 | Architect session | deferred — parked until owner unblocks billing |
| F1.7 | any dev agent | flaky web-context tests |

F1.1 (verified backup + per-domain export) shipped and verified against prod on
2026-07-07; runbook: `docs/operations/backup-restore.md`. Keep the backup cadence
from the runbook (before every migration deploy, at least weekly).

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

### F1.6 Paid LLM model — DEFERRED (parked until owner unblocks billing)

Parked by the owner on 2026-07-08. `mimo-v2.5-free` stays as the interim prod model
(~3s/call, "tuteo" register). When billing is resolved: run
`scripts/agent-model-eval.mjs eval kimi-k2.7-code minimax-m3 deepseek-v4-flash
qwen3.6-plus`, compare against the mimo baseline (5/5, ~2.9s), pick by correct
tool-calling first and latency second, update `OPENAI_COMPAT_MODEL` on Railway and
smoke in prod. If the winner uses "tuteo", adjusting the system-prompt builders for
"voseo" is a separate, optional item.

### F1.7 Stabilize the flaky web-context tests

**Why:** `apps/web/src/__tests__/provider-contexts.test.tsx` and
`apps/web/src/ui/screens/tasks/dashboard/__tests__/tasks-dashboard-context.test.tsx`
time out (~17-18s) under full-suite parallel load — they pass in isolation. They are
StrictMode double-invoke idempotency tests, unrelated to any feature; they can red a
green PR and erode trust in CI.

**Scope:** find why they time out only under parallel load (likely a real timer / act
flush or a too-tight timeout), fix the test (not the product code unless a genuine
idempotency bug surfaces), and confirm 10 consecutive full-suite runs are green.

**Done when:** `pnpm --filter @vdp/web test` passes reliably; no `-t` isolation needed.

## Phase 2 — Project task breakdown (active)

Chosen 2026-07-08 from the F1.2 usage signal (Tasks+Projects is the daily surface;
Objectives/Health barely touched) plus owner friction: turning a project into a set
of board tasks is tedious one-by-one. The bet — the **Tasks agent** (which already
owns task creation) proposes a batch of tasks for an **existing project** and, on one
owner confirmation, creates them assigned to that project + board column. This is the
VDP-native answer to the "Notion + MCP board loading" pattern the owner flagged,
kept inside VDP (its board/ritual is the product) and inside the suggest-then-write
rule (batch HITL), instead of exposing an MCP server for an external agent client.

Grounding (verified on main): `CreateTaskCommand` already accepts `projectId` +
`boardStatus` and validates project ownership (defaults `backlog`); the gap is only
that the agent's `create_task` tool does not expose them. Projects has no agent — this
capability lives on the **Tasks** agent. Each item is a self-contained session per
`docs/WORKFLOW.md`. One PR in flight at a time; F2.1 before F2.2.

Cross-cutting rules for all F2 items: the agent **proposes first, creates only on
explicit owner confirmation** (never auto-write); cap a proposal at a sane count
(~3–8) to keep confirmation meaningful and the board calm; reuse the existing
create-time similarity check so a breakdown does not spam duplicates of tasks already
on the project; new tasks default to the `backlog` column; auth-context and
`localDateStringSchema` tool rules from AGENTS.md §Agent Architecture apply.

Assignments (owner fills the agent when taking the item; one PR in flight):

| Item | Agent | Status |
|---|---|---|
| F2.1 | Claude Code Opus 4.8 | shipped (PR #9) — get_project_context + create_project_tasks |
| F2.2 | _TBD_ | not started — take next |
| F2.3 | — | deferred (owner decision) |

To run one: point the agent at it with the dev-agent kickoff — "Read AGENTS.md and
docs/WORKFLOW.md, then run an implementation session for ROADMAP item F2.1 per the
dev-agent session protocol." F2.1 is an agent-tool session, so it also follows the
`create-agent-tool` skill.

### F2.1 Agent project-breakdown capability (backend + prompt)

**Why:** the capability that removes the friction. The Tasks agent can read a project
and create a batch of tasks assigned to it, in one round-trip and one confirmation.

**Scope:**
- A new agent tool (e.g. `create_project_tasks`) that takes a project and a list of
  task drafts (title, optional priority) and creates them via `CreateTaskCommand`
  with `projectId` + `boardStatus: backlog`, returning the created list. Add it to
  the typed registry in `packages/shared/src/constants/agent-tools.ts` first.
- A read path so the agent can propose good tasks without duplicating existing ones:
  either a `get_project_context` tool (project outcome, next action, existing tasks —
  the accepted Tasks→Projects read) or project context seeded into the conversation.
- **Design decision for the session (escalate if it needs conversation-context
  plumbing):** prefer scoping the active `projectId` to the conversation so the LLM
  never handles the UUID; a validated `projectId` tool param is acceptable as a
  fallback since `CreateTaskCommand` already rejects projects the user does not own.
- Tasks agent system-prompt workflow rule: given a project, propose 3–8 concrete,
  board-ready tasks (one line each), then **wait for explicit confirmation** before
  calling the batch tool. Keep it Spanish (agent-prompt language rule).
- Tests: tool factory over CQBus + auth context; cross-user isolation (a user cannot
  create tasks into another user's project); prompt still builds per-chat.

**Out of scope:** creating the project itself (breakdown starts from an existing
project); per-task editing before create (F2.3); board-column intelligence beyond
`backlog`.

**Done when:** in a chat, given an existing project, the agent proposes a task list
and — only after the owner confirms — creates them assigned to the project's board,
verified by unit tests on the tool + an e2e that boots Tasks + Projects.

### F2.2 Breakdown entry point from a project (frontend)

**Why:** the capability needs a one-tap door where the owner already works — the
project screen — not a cold chat.

**Scope:**
- On the project detail surface, a "Desglosar en tareas (IA)" action that opens the
  agent chat with the **Tasks** agent, seeded with the project (starter message +
  the project context/id the F2.1 tool needs).
- Resolve chat availability on the Projects screen: Projects has no agent, so the
  chat panel is gated off there today (`chat-panel.tsx` / `domainHasAgent`). This
  entry must make the Tasks agent available from a project without pretending
  Projects has its own agent. Keep the change scoped to this entry point.
- Presenter/humble-view work + a presenter test.

**Out of scope:** redesigning the project screen; a bespoke proposal UI (F2.3 — the
first cut confirms conversationally in the chat).

**Done when:** from a project, one tap opens the seeded Tasks-agent chat ready to
propose the breakdown, no regression to the project screen or the existing chat.

### F2.3 Reviewable proposal + per-task edit — DEFERRED

Owner decision (2026-07-08): ship the batch-confirm flow first (F2.1+F2.2). Add a
reviewable proposal card — edit/remove/reorder drafts before creating, per-task
instead of all-or-nothing — only if the conversational batch confirm proves too
coarse in daily use. Do not build speculatively.

## Phase 2 backlog (deprioritized by the F1.2 signal, revisit later)

The earlier Phase-2 candidates now rank below the breakdown flow because usage shows
their surfaces are barely touched: **command palette** on `Ctrl+K` (capture→inbox,
jump, complete, log) — still attractive for micro-capture friction, the natural
second F2 track; **Objectives weekly retro** and **Health weekly summary** — hold
until F1.2 data shows those surfaces earn daily use (today they do not).

## Later phases (scope with the owner on arrival)

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

## Needs owner decision

Agents: when an implementation session hits a product/scope question, append one
bullet here — `YYYY-MM-DD — <question> — <one line of context> — recommendation:
<yours>` — then keep going on what's decidable. The owner and the Architect triage
this section; decided items get removed and their outcome lands in the relevant
doc or ROADMAP item.

(empty)

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
