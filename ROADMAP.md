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
| Projects | ✅ | ✅ | ✅ | Active direction, board, clients, time tracking, reports, expected-income links to Wallet, and a read-only evidence agent |
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

Active implementation slice:

1. **F2.3 Projects responsive UI polish** — keep the Projects workspace readable
   when the desktop chat reduces its available width, and keep task cards compact
   when titles are long. This is presentation-only: Tasks remain the work-item
   store, board moves keep their existing command path, and proposal persistence is
   unchanged.

Next:

1. **Command palette (`Ctrl+K`)** only if daily use confirms micro-capture friction.
   Objectives weekly retro and Health weekly summary remain below that signal.

The Projects agent stays read-only until real use demonstrates which confirmed write,
if any, would remove recurring friction. Do not promote a write tool speculatively.

One feature per implementation session, through the per-feature gate in `AGENTS.md`,
then stop at the PR per `docs/WORKFLOW.md`.

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

- **F2.3 Projects responsive UI polish** — owner walkthrough completed on
  2026-07-13: viewport breakpoints kept the project list and four-column board split
  after the chat reduced the content area, causing overlap and very narrow task
  cards. Make both layouts respond to their containers, clamp long task titles, and
  replace the three repeated move pills with one compact destination control. Card
  dismissal still resets on a full page reload (client-local state; no proposal
  persistence by design).
- **Projects agent confirmed writes** — hold until real use shows recurring friction.
  Candidates, in likely order, are logging time, updating project direction, and
  moving an existing board Task. Each needs its own confirmed-write slice. Task
  creation/breakdown stay Tasks-owned and agent deletes remain prohibited.
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
