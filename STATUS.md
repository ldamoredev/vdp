# STATUS

In-flight session state — the model-agnostic continuity note. Distinct from
`ROADMAP.md` (milestone sequencing) and from any agent's private memory
(model/machine facts). Written by the `checkpoint` skill at session end, read by
`orient` at session start. Keep it short; trim resolved notes.

_Last updated: 2026-07-08 (F2.1 shipped + merged; F2.2 next)_

## Done (recent)

- **F2.1 — agent project-breakdown capability** shipped & merged (PR #9): the
  Tasks agent turns an existing Projects project into a batch of board tasks on
  one confirmation. Two new tools in `server/.../tasks/infrastructure/agent/tools/project-tools.ts`
  — `get_project_context` (reads project direction + existing board tasks over the
  CQBus) and `create_project_tasks` (ownership guard up front, then 1–8 drafts via
  `CreateTaskCommand` into `backlog`, capped at 8, reusing the similarity check).
  System prompt gained a "desglose de proyecto" suggest-then-confirm workflow.
  `projectId` is a validated tool param (not conversation-scoped) — no
  conversation-context plumbing exists and `CreateTaskCommand` already rejects
  non-owned projects. Tasks e2e config now boots `ProjectsModule` alongside
  `TaskModule`.
- **Phase 1 complete** except F1.6 (deferred): F1.1 verified backup + per-domain
  export (`docs/operations/backup-restore.md`, backup verified against prod via
  the Supabase session pooler); F1.2 owner-usage instrumentation
  (`core.usage_events` + `UsageTrackingMiddleware`, `docs/operations/usage-instrumentation.md`);
  F1.3 objectives deadline signal; F1.4 objectives on `/home`; F1.5
  Tasks/Projects/Work boundary (`AGENTS.md`); F1.7 flaky web-context tests
  stabilized.
- **Multi-agent workflow** established: `docs/WORKFLOW.md` owns the current role
  matrix and model roster; feature branch → PR → owner rebase-merge. `main` is
  branch-protected (CI required). PR template in `.github/`.
- **Prod agent chat live** on vdpapp.com.ar for the owner only: OpenCode Zen
  (openai-compatible), interim model `mimo-v2.5-free`.
- **Follow-ups shipped:** objectives deadline signal now fires on `/home` load
  (PR #4); Tasks agent prompt routes project-like work to Projects (PR #6).

## In progress

- Nothing mid-slice, no open PRs. F2.1 merged; clean point to take F2.2.

## Next

1. **F2.2 — breakdown entry point from a project (frontend)** (`ROADMAP.md`
   Phase 2, now unblocked): on the project detail surface, a "Desglosar en tareas
   (IA)" action that opens the **Tasks** agent chat seeded with the project (starter
   message + the project id/context the F2.1 tools need). Key wrinkle: Projects has
   no agent, so the chat panel is gated off there today (`chat-panel.tsx` /
   `domainHasAgent`) — this entry must make the Tasks agent available from a project
   without pretending Projects has its own agent, scoped to this entry point.
   Presenter + humble view + a presenter test. F2.3 (per-task edit) deferred by owner.
2. **Phase 2 backlog** (deprioritized by F1.2 signal): command palette (`Ctrl+K`);
   Objectives weekly retro; Health weekly summary.

## Notes for next session

- **F1.2 data is ~1 day old** (deployed 2026-07-08). Let it run ~2 weeks before
  leaning on it; read deliberate signals (writes, agent opens, drill-downs) over
  raw GETs, which are confounded by `/home` fan-out. Early read is consistent with
  the owner's stated Tasks+Projects focus; Objectives barely touched.
- **Open owner decisions:** paid LLM model (F1.6, blocked on OpenCode billing);
  whether to promote Objectives to an agent (Phase 4 — validate with F1.2 first);
  mobile/PWA priority (decide with F1.2).
- **F2.2 depends on the F2.1 seed contract:** the F2.1 tools take `projectId` as a
  tool param and there is deliberately no `list_projects` tool, so a cold chat can't
  resolve a project by name. F2.2 is the intended path — it must seed the Tasks-agent
  chat with the project id (+ a starter message) from the project screen.
- **Workflow:** module-boundary enforcement (`.dependency-cruiser`) still worth
  considering, less optional now that Tasks reads Projects at runtime (still via CQBus
  queries, the accepted style — not a direct dependency). Run a `workflow-retro` in a
  few weeks to prune whatever didn't pay rent.
