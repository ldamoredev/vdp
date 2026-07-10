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

## Scope snapshot

| Domain | Backend | Frontend | Agent | Status |
|---|---|---|---|---|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, weight, mood/energy, and private medical records; medical has no agent by design |
| Projects | ✅ | ✅ | — | Active direction, board, clients, time tracking, reports, and expected-income links to Wallet |
| Objectives | ✅ | ✅ | — | Active Life Goals layer with manual and evidence-backed read-time progress |
| Inbox | ✅ | ✅ | — | Active universal capture + explicit triage routing; suggestions never auto-route |
| People | — | Disabled demo page | — | Inactive; deferred indefinitely |
| Work | — | Disabled demo page | — | Inactive; current needs are owned by Tasks and Projects per `AGENTS.md` |
| Study | — | Disabled demo page | — | Inactive |

The Tasks agent is proactive: daily briefs and weekly prep seed chat on
`/home`/`/review`, and task insights become concrete nudges. Medical stays off the
LLM by design.

Production agent provider: OpenCode Zen (`openai-compatible`), with
`mimo-v2.5-free` as the interim model and chat gated to the owner. The paid-model
evaluation remains parked below; harness: `scripts/agent-model-eval.mjs`.

## Current sequencing

The active slice is **F2.3 — reviewable project-task proposal**. The owner activated
it on 2026-07-10 after the project-breakdown capability and its project-screen entry
point were in daily-use shape. One feature per implementation session, through the
per-feature gate in `AGENTS.md`, then stop at the PR per `docs/WORKFLOW.md`.

## Phase 2 — Project task breakdown (active)

The Tasks agent owns task creation; Projects owns project direction and the board.
The existing flow starts from a Projects board, opens a seeded Tasks-agent chat,
reads the project context, proposes 3–8 tasks, waits for explicit confirmation, and
creates the confirmed batch in `backlog`. F2.3 replaces the fragile free-text review
step with a structured, editable proposal while preserving that ownership boundary
and the suggest-then-write rule.

### F2.3 Reviewable proposal + per-task edit — NEXT

**Why:** conversational confirmation proves the core flow, but a batch is easier to
trust when the owner can inspect and adjust the exact titles and priorities before
the single write. This is HITL quality, not a new planning surface.

**Behavior contract:**

- After `get_project_context`, the Tasks agent emits a structured proposal through a
  new read-only `propose_project_tasks` tool. It accepts the `projectId` plus 3–8
  drafts (`title`, optional `priority`), validates the owner-scoped project and the
  drafts through auth-derived CQBus context, and returns the normalized proposal.
  It never writes Tasks or Projects data.
- The chat renders that tool result as a Tasks-owned proposal card. The owner can
  edit title/priority, remove drafts, and reorder them. Keep the interaction calm and
  dependency-free; move-up/down controls are sufficient — no drag-and-drop library.
- The card is reconstructible from persisted tool results when conversation history
  reloads. Editing state may remain client-local; there is no proposal aggregate,
  table, or server-side draft lifecycle.
- Confirming the card sends a machine-authored explicit confirmation message into
  the same Tasks conversation containing the exact `projectId` and final ordered
  drafts. The Tasks prompt must then call the existing `create_project_tasks` tool
  exactly once with that exact list. The final list may contain 1–8 drafts after
  removals.
- Dismissing/cancelling the card performs no write. Closing the chat, navigating
  away, or losing the stream before confirmation must also create nothing.
- The created-result card reports the number of tasks created and surfaces any
  `similarTasks` warnings already returned by `create_project_tasks`; task-change
  synchronization refreshes the project board.

**Required implementation shape:**

- Add `propose_project_tasks` to the shared typed agent-tool registry first, then
  implement it through the `create-agent-tool` skill with auth-derived CQBus context.
- Update the per-chat Tasks system-prompt builder to use
  `get_project_context → propose_project_tasks → wait → create_project_tasks`.
- Keep proposal parsing and editing under `ui/chat`; do not add a Projects agent or
  move chat state into the Projects presenter. Extend the existing stream/persisted
  message mapping with typed proposal data instead of parsing assistant prose.
- Tests: read-only proposal-tool validation and cross-user isolation; prompt
  contract; stream + persisted-history mapping; proposal editing/reordering/removal;
  exact confirmation payload; no write before confirmation; and an e2e Tasks +
  Projects flow through final creation.

**Out of scope:** creating or editing the Project; task descriptions, dates, or board
column selection; a generic agent-card framework; a new batch HTTP API; proposal
persistence; autonomous creation; partial writes before the final confirmation; and
redesigning the project board or global chat.

**Done when:** from a project board, the Tasks agent produces a structured proposal
card; the owner can edit/remove/reorder it; no task exists before confirmation; one
confirmation creates exactly the final 1–8 drafts in project `backlog`; the board
refreshes; and the automated flow plus owner-run browser smoke pass.

## Parked prerequisite

### F1.6 Paid LLM model — DEFERRED

Parked by the owner on 2026-07-08 until OpenCode billing is unblocked.
`mimo-v2.5-free` remains the interim production model. When unblocked, run:

```bash
node scripts/agent-model-eval.mjs eval kimi-k2.7-code minimax-m3 deepseek-v4-flash qwen3.6-plus
```

Compare against the mimo baseline (5/5, ~2.9s), choose correct tool-calling first
and latency second, update `OPENAI_COMPAT_MODEL` on Railway, and smoke in production.
Voseo tuning, if needed, is a separate optional prompt change.

## Phase 2 backlog

- **Command palette (`Ctrl+K`)** — capture to Inbox, jump, complete, and log. Natural
  next candidate after F2.3 if daily use confirms micro-capture friction.
- **Objectives weekly retro** and **Health weekly summary** — hold until usage data
  shows those surfaces earn regular use.

## Later phases (scope with the owner on arrival)

- **Phase 3 — Cross-domain intelligence:** composed read-time dashboard (Objectives ×
  Wallet × Health × Projects, one-tap action per tile); generated quarter/year in
  Review. An insight without an attached decision does not get built. Consider a
  read-model layer only at the third composed surface.
- **Phase 4 — Agents** (requires a stable paid model): Objectives weekly gap analysis
  with confirmed corrective Tasks; formalize the write gradient; verify tool-call
  auditing; add a cross-domain brief orchestrator only if domain agents see daily use.
- **Phase 5 — Optional expansion:** People only after manually validating its weekly
  loop; Study/Work only for a concrete daily-loop need not owned by existing domains.

## Needs owner decision

Agents: when an implementation session hits a product/scope question, append one
bullet here — `YYYY-MM-DD — <question> — <context> — recommendation: <yours>` — and
continue with whatever remains decidable. The owner and Architect triage this list.

(empty)

## Parked

### R4 Unify `/home` + `/review` into one Today surface

Parked on 2026-07-06. The separate morning-plan and evening-close rituals already
share server-backed state and work. Revisit only if the split becomes demonstrated
daily friction.

## Data constraint

Production data is not disposable. Migrations are forward-only unless the owner
explicitly authorizes a disposable local reset. Deploys remain owner-run and apply
all pending migrations after taking the backup required by the operations runbook.
