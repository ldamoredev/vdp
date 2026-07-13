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

Phase 2's project-breakdown flow is complete: F2.3 shipped on 2026-07-10 (PR #11)
after the owner smoke. The active slice is **F2.4 — Projects read-only agent**, scoped
below. It pulls the Phase 4 "domain agents" line forward deliberately: the interim
`mimo-v2.5-free` model already serves Tasks/Wallet/Health chat, and a read-only
Projects agent does not depend on the paid-model evaluation.

One feature per implementation session, through the per-feature gate in `AGENTS.md`,
then stop at the PR per `docs/WORKFLOW.md`.

## F2.4 — Projects read-only agent — NEXT

**Why:** Projects already owns direction, boards, time and expected-income reports,
but interpreting those surfaces still requires the owner to join the evidence by
hand. A domain agent earns its place if it can answer "where is this project stuck?"
or "what did I actually advance this week?" from real data without becoming a
second task manager or opening a new planning surface. Read-only first validates
that synthesis before any write permission or custom confirmation UI is added.

**Behavior contract:**

- Register a `projects` domain agent and expose its standard persisted conversation
  routes under `/api/v1/projects/agent/*`. Every tool derives identity from
  `AuthContextStorage` and executes owner-scoped CQBus queries; no tool input accepts
  or exposes `userId`.
- Give the agent exactly four read tools:
  - `list_projects`: list direction records with optional `status`
    (`active|archived|all`, default `active`) and `kind` filters. Return ids, outcome,
    next action, focus, client/rate context and lifecycle.
  - `get_project_board`: require `projectId`; return the owner-scoped project
    direction plus its existing Tasks grouped by `backlog|next|doing|done`, including
    task status and priority. Compose the existing Projects and Tasks CQBus queries;
    do not introduce another board or work-item read model.
  - `list_project_time_entries`: read entries for an explicit `fromDate`/`toDate`
    range and optional `projectId`, with project labels added from existing project
    data. Validate local dates and reject an inverted range before dispatch.
  - `get_project_hours_report`: read the existing hours report for an explicit date
    range with optional project/client filters. Preserve separate ARS/USD expected-
    income totals; never combine currencies.
- The prompt identity is **project direction and operations analyst**: concise,
  evidence-first, and oriented to one useful decision. It reads before making data
  claims, contrasts declared outcome/next action/focus with board and time evidence,
  and distinguishes a missing datum from a conclusion.
- The agent may suggest a next decision or a task title in prose, but it never
  creates, edits, moves, completes or archives anything in F2.4. When the owner asks
  for task creation or project breakdown, it points to the Tasks agent / existing
  "Desglosar en tareas (IA)" flow instead of impersonating that capability.
- On `/projects` and `/projects/history`, the existing route-aware global chat
  selects Projects and uses `/projects/agent/chat`; outside a domain, Projects joins
  the existing agent selector. No new chat shell or conversation store.
- Add one contextual action for the selected board, **"Revisar proyecto (IA)"**,
  which opens a fresh Projects conversation seeded with the `projectId` and asks for
  a short evidence-backed review. Keep the existing Tasks-owned breakdown action
  beside it and visibly distinct.
- No autonomous brief, insight, background detection or cross-domain event is added.
  The agent responds only when the owner opens or messages it.

**Write gradient after F2.4:** validate real use first. Candidate confirmed writes,
in likely order, are logging time, updating project direction and moving an existing
board Task. Each would be a separately scoped slice with an explicit confirmation
contract. Task creation and breakdown remain permanently Tasks-owned; agent deletes
remain prohibited.

**Required implementation shape:**

- Add a typed `PROJECTS_AGENT_TOOL_NAMES` / `ProjectsAgentToolName` registry to
  `@vdp/shared` and include it in `AgentToolName` before defining server tools.
- Add a per-chat Projects prompt builder, `ProjectsAgent`, read-tool factories and a
  thin Projects agent controller following the existing Tasks/Wallet/Health pattern;
  register them through `ProjectsModuleRuntime` / `ProjectsModule`.
- Reuse `ListProjectsQuery`, `GetProjectQuery`, `GetTasksQuery`,
  `ListTimeEntriesQuery` and `GetProjectHoursReportQuery`. Tool-level normalization
  may compose those queries, but F2.4 adds no repository method, table, migration,
  HTTP business endpoint or direct Drizzle read.
- Follow `create-agent-tool` for the typed registry/auth/CQBus shape and
  `tdd-workflow` for implementation. Manually audit the auth-context rules in
  `AGENTS.md` because agent tools and module runtimes are auth-sensitive.
- Web changes stay in the existing navigation/chat-launch and Projects board
  presenter/view boundaries. No Projects-specific message card or generic agent-card
  abstraction is required.
- Tests cover tool schemas/date validation/range validation, owner isolation and
  missing projects; board grouping; currency-separated reports; prompt freshness and
  Tasks-boundary wording; runtime/agent registration; streaming plus conversation
  isolation for `/projects/agent/*`; Projects navigation selection; and the contextual
  launch request targeting a new Projects conversation.

**Out of scope:** any Projects or Tasks write tool; client management; project/task
creation; task breakdown; updating direction; moving board Tasks; logging/editing/
deleting time; archiving/unarchiving; proactive briefs or insights; structured
analysis cards; report redesign; generic chat refactors; new persistence; and paid-
model selection.

**Done when:** from the Projects route the owner can open the Projects agent, resume
persisted Projects conversations, ask about direction/board/time/reports, and receive
an owner-scoped evidence-backed answer; the selected-board review action launches the
correct project context; the existing breakdown action still opens Tasks; no agent
path can mutate Projects or Tasks; targeted backend/web tests, full typecheck/lint,
CI and the owner-run browser smoke pass.

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

- **F2.3 UI polish** — the owner flagged visual issues in the proposal-card UI
  during the F2.3 smoke (2026-07-10); specifics pending an owner walkthrough.
  Bundle with it the accepted limitation that card dismissal resets on a full page
  reload (client-local state; no proposal persistence by design).
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
