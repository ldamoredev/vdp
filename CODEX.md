# Codex Setup For VDP

This folder mirrors the local Claude setup in Codex-native form.

## What Was Replicated

| Claude asset | Codex equivalent |
| --- | --- |
| `CLAUDE.md` | `AGENTS.md` plus this index |
| `.claude/skills/*` | `.agents/skills/*` |
| `.claude/commands/*` | `.codex/commands/*` |
| `.claude/agents/*` | `.codex/reviewers/*` |
| `.claude/hooks/*` | `.codex/hooks/*` |
| `.claude/launch.json` | `.codex/launch.json` |

`.claude/dev-credentials.env` was intentionally not copied.

## Project Skills

Use these skills directly in prompts when you want Codex to follow the project workflow:

- `$vdp-server-module`: create or extend backend domain modules.
- `$vdp-frontend-module`: create or extend frontend feature modules.
- `$drizzle-migration`: make schema and migration changes end to end.
- `$agent-tool-author`: add or modify server-side AI agent tools safely.

## Commands

The command files in `.codex/commands/` are prompt recipes. They preserve the old Claude slash-command workflows in a form Codex can read and execute:

- `new-server-module.md`
- `new-frontend-module.md`
- `new-component.md`
- `demo-pages.md`

## Reviewers

The reviewer prompts in `.codex/reviewers/` are for manual or delegated review passes:

- `auth-context-reviewer.md`: use after agent tool/controller/runtime changes.
- `drizzle-repository-reviewer.md`: use after schema, repository, fake repository, or migration changes.

## Hooks

Codex does not use Claude Code hook JSON directly. The translated hook scripts are kept in `.codex/hooks/` as reusable checks:

- `block-secret-edits.sh`: rejects paths that look like secrets.
- `typecheck-on-edit.sh`: runs the relevant TypeScript check for a changed server or web file.

Run them manually, wire them into local automation, or reuse the logic in future Codex automation.

