# STATUS

In-flight session state — the model-agnostic continuity note. Distinct from
`ROADMAP.md` (milestone sequencing) and from any agent's private memory
(model/machine facts). Written by the `checkpoint` skill at session end, read by
`orient` at session start. Keep it short; trim resolved notes.

_Last updated: 2026-07-08 (Phase 1 closed; Phase 2 scoped; workflow-lifecycle skills added)_

## Done (recent)

- **Phase 1 complete** except F1.6 (deferred): F1.1 verified backup + per-domain
  export (`docs/operations/backup-restore.md`, backup verified against prod via
  the Supabase session pooler); F1.2 owner-usage instrumentation
  (`core.usage_events` + `UsageTrackingMiddleware`, `docs/operations/usage-instrumentation.md`);
  F1.3 objectives deadline signal; F1.4 objectives on `/home`; F1.5
  Tasks/Projects/Work boundary (`AGENTS.md`); F1.7 flaky web-context tests
  stabilized.
- **Multi-agent workflow** established: `docs/WORKFLOW.md` (Architect = Opus 4.8 +
  owner; dev agents = Sonnet 5 / Codex GPT 5.5 / opencode Kimi K2.7-code | GLM 5.2;
  feature branch → PR → owner rebase-merge). `main` is branch-protected (CI
  required). PR template in `.github/`.
- **Prod agent chat live** on vdpapp.com.ar for the owner only: OpenCode Zen
  (openai-compatible), interim model `mimo-v2.5-free`.
- **Follow-ups shipped:** objectives deadline signal now fires on `/home` load
  (PR #4); Tasks agent prompt routes project-like work to Projects (PR #6).

## In progress

- Nothing mid-slice. This session added the workflow-lifecycle skills
  (`open-pr`, `checkpoint`, `orient`) + this `STATUS.md`, adapted from a peer repo
  (tourney-tracker) and combined with VDP's multi-agent model.

## Next

1. **Phase 2 — Project task breakdown** (active, `ROADMAP.md`): the Tasks agent
   proposes a batch of tasks for an existing project and creates them on one owner
   confirmation. Ordered slices: **F2.1** (agent breakdown capability — batch tool
   + prompt; `create-agent-tool` skill applies), then **F2.2** (breakdown entry
   point from a project screen). F2.3 (per-task edit) deferred by owner. Owner
   assigns the agent per item in the ROADMAP Phase 2 table; one PR in flight.
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
- **Workflow-skill synthesis in progress:** `open-pr`/`checkpoint`/`orient` added
  this session. Deferred for a later Architect session: enriching `tdd-workflow`
  with a spec-approval gate + export-delta pause; adding code-review effort tiers +
  the safe review fan-out recipe; a `workflow-retro` skill; considering
  `.dependency-cruiser` for compile-time module boundaries. Adopt incrementally,
  then run a retro to prune what didn't pay rent.
