# STATUS

In-flight session state — the model-agnostic continuity note. Distinct from
`ROADMAP.md` (milestone sequencing) and from any agent's private memory. Written by
`checkpoint`, read by `orient`; keep it short and prune resolved notes.

_Last updated: 2026-07-10 (F2.2 shipped; F2.3 activated and scoped next)_

## Done (recent)

- **F2.2 — project-screen breakdown entry point** shipped and merged (PR #10): the
  Projects board opens a new Tasks-agent conversation seeded with the selected
  project id and direction. Projects remains agentless; a one-shot chat launch
  request pins Tasks while the proposal streams. Typecheck, 610 web tests, lint,
  CI, and the owner-account browser smoke passed; smoke conversation data was
  deleted by id.
- **F2.1 — Tasks-agent project breakdown** shipped and merged (PR #9):
  `get_project_context` reads project direction + existing board Tasks through
  CQBus, and `create_project_tasks` creates one confirmed 1–8-task batch in project
  `backlog`, with ownership validation and duplicate warnings.
- Phase 1 is complete except the paid-model evaluation (F1.6), which remains parked
  until OpenCode billing is unblocked. Usage instrumentation has been live since
  2026-07-08; backups, Objectives deadline signals/home visibility, the
  Tasks/Projects/Work boundary, and flaky-test stabilization are already shipped.
- The multi-agent workflow is active; `docs/WORKFLOW.md` owns the role matrix.
  Architect models are Claude Code Opus 4.8, Fable 5, and Codex GPT-5.6 Sol with
  equal role boundaries; merge/deploy remain owner-only.

## In progress

- Nothing mid-slice. Documentation is reconciled with `main`; F2.3 product code has
  not started yet. This is the clean handoff point for its implementation session.

## Next

1. **F2.3 — reviewable project-task proposal** (`ROADMAP.md`): add a read-only
   structured proposal tool and a Tasks-chat card where the owner can edit priority
   and title, remove drafts, reorder them, and explicitly confirm the exact final
   batch. No Tasks write before confirmation; final creation continues through the
   existing owner-scoped `create_project_tasks` tool.
2. After F2.3 has real usage, reconsider the command palette (`Ctrl+K`). Objectives
   weekly retro and Health weekly summary remain below that signal.

## Notes for next session

- Owner decision (2026-07-10): proceed with F2.3; it is no longer conditional or
  deferred. Follow `tdd-workflow` plus `create-agent-tool`; close through `open-pr`.
- F2.3 must use structured tool data, not parse assistant prose. The proposal is
  read-only and reconstructible from persisted tool results; edits are client-local;
  confirm sends the exact final drafts back into the same Tasks conversation; no
  proposal table, generic card framework, Projects agent, or batch HTTP endpoint.
- Usage data is still young. Let it accumulate for roughly two weeks before using it
  to promote Objectives, prioritize mobile/PWA, or infer habits from raw `/home` GETs.
- Open owner decisions: paid LLM model (blocked on billing), Objectives agent
  promotion, and mobile/PWA priority.
- Tasks↔Projects is the only accepted synchronous strong coupling and remains CQBus /
  repository-interface scoped. Consider mechanical boundary enforcement only if
  the documented rule starts being violated; do not add it speculatively.
