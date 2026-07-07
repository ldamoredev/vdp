<!-- Title: conventional style, e.g. "feat(objectives): deadline-approaching signal" -->

## ROADMAP item

<!-- e.g. F1.2 — Owner-usage instrumentation. One item per PR. -->

## Agent

<!-- e.g. Codex GPT 5.5 / Claude Code Sonnet 5 / opencode Kimi K2.7-code -->

## What shipped

<!-- 2-5 lines: what exists now that didn't before, and the key design decision(s). -->

## Per-feature gate

- [ ] Backend (CQBus handlers, entities, repos) — or N/A
- [ ] Shared contracts (`@vdp/shared`) — or N/A
- [ ] Frontend (core module + presenter + screen) — or N/A
- [ ] Tests at the right levels (unit / integration / e2e), cross-user isolation where user-owned data is touched
- [ ] Migration + the three synchronized DB changes (schema / `SETUP_SQL` / `truncate()`) — or N/A
- [ ] Docs (AGENTS.md / ROADMAP.md / architecture) — or N/A

## Verification evidence

<!-- Paste the commands you ran and their tail. CI re-runs the full ladder, but
     the PR must state what YOU verified locally. -->

```
```

## Self code-review

<!-- Findings from the code-review skill's three passes: fixed ones in one line
     each; accepted ones with the reason. "No findings" is a valid answer only
     after actually running the passes. -->

## Notes for the reviewer

<!-- Smoke steps if there's a UI surface, dev-data created (for surgical cleanup),
     anything appended to ROADMAP §Needs owner decision, follow-ups noted. -->
