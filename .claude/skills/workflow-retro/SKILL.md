---
name: workflow-retro
description: Architect-only retrospective on the AGENT WORKFLOW itself (not the product) — audit skills, hooks, permissions, repo docs, and memory for friction, drift, and rules that stopped paying rent, then propose changes with their economics and apply the approved ones. Pruning is half the job. Invoke when the owner asks to review or improve the workflow, says "retro", or after a stretch of sessions with repeated friction. Never a dev-agent skill.
---

# workflow-retro

The self-reflection loop, run on demand by the **Architect** (Opus + owner). Its
subject is the *workflow*, not the product: `checkpoint` closes a session's product
state; this closes its process debt. An instruction set that only grows eventually
degrades the agents it steers — so this skill treats **pruning as half the job**,
and "nothing worth changing" is a valid outcome.

## When to use / when NOT

- **Use** when: the owner says "retro" / "review the workflow", after a stretch with
  repeated manual corrections, or periodically (e.g. after a phase ships) to prune
  what accumulated. Architect session only.
- **Do NOT** use it inside a dev-agent implementation session (that's `tdd-workflow`
  → `open-pr`), and don't use it to review product/feature decisions (that's
  `PRODUCT_ANALYSIS.md` / the ROADMAP).

## Steps

1. **Gather friction evidence** — concrete, not vibes: what needed a manual
   correction this stretch, which permission prompts recurred, which hook fired
   noise, where an agent guessed wrong and a rule would have prevented it, what the
   owner had to repeat across sessions. Include the **multi-agent dimension**: are
   the dev-agent kickoff prompts working, is the opencode bake-off producing signal,
   are non-Claude agents actually following the markdown skills?
2. **Inventory the machinery:** `.claude/skills/*`, hooks and both permission lists
   in `.claude/settings*.json`, `AGENTS.md` / `docs/WORKFLOW.md` rules, and the
   agent memory index.
3. **Rent check (pruning is half the job).** For each existing rule, skill, and
   memory: has it fired recently? Would anything break without it? Propose deletions
   with the same seriousness as additions. A skill nobody invoked, a rule no agent
   tripped, a memory now codified in `AGENTS.md` — candidates to cut.
4. **Route each proposed fix to its right home**, preferring mechanical over prose
   (a deny rule or hook beats an `AGENTS.md` sentence beats a hope): hook /
   permission → `.claude/settings*.json`; repeatable procedure → a skill;
   operational rule → `AGENTS.md`; role/session protocol → `docs/WORKFLOW.md`;
   personal or machine fact → agent memory. **Never two homes for one fact.**
5. **Present proposals with their economics** — what each costs (tokens, prompts,
   maintenance) and saves, and what was considered and rejected. Don't invent
   findings to justify the run.
6. **Apply what the owner approves.** Workflow-file changes (`.claude/**`, `**.md`)
   are the `open-pr` content-only path — commit and push directly, no PR.
7. **Record rejections in agent memory** so the next retro doesn't re-propose them.

## Notes

- **Loops/crons stay rejected by default:** solo interactive project, CI polling is
  forbidden, scheduled cloud agents bill. Revisit only if a genuinely unattended
  process appears.
- If memory itself looks stale mid-retro, run the memory-hygiene pass
  (`consolidate-memory`) rather than cleaning it ad hoc.
- The point is a *smaller, sharper* workflow over time, not a bigger one. If a retro
  only ever adds, it's being run wrong.
