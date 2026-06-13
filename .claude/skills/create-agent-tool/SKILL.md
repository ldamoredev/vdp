---
name: create-agent-tool
description: Scaffold one LLM agent tool for an existing domain agent (typed registry entry, tool factory over services + auth context, system-prompt rule, and tests). Use when the owner asks to add or expose an agent tool for a domain.
---

# create-agent-tool

Scaffolds one tool on an existing domain agent, following `HealthTools`/`tasks` reference shape. Agent tools are factory functions over `ServiceProvider` + `AuthContextStorage` that execute use-case services and return serialized results.

## Inputs (ask if missing)

- **domain** (tasks, wallet, health — the agents that exist).
- **tool name** in `snake_case` (`archive_goal`).
- which **service(s)** it calls and the tool's input schema.
- whether it reads or mutates (mutating tools usually return the affected entity's snapshot).

## Files to create / touch

1. `packages/shared/src/constants/agent-tools.ts` — **add the name to the domain's tool-name union FIRST** (both server definitions and web tool handling typecheck against it). `pnpm --filter @vdp/shared build`.
2. `server/src/modules/{domain}/infrastructure/agent/tools.ts` — add a `jsonTool({...})` entry: name, description (written for the LLM), `inputSchema`, and an `execute` that derives `userId` inside and calls the service.
3. `server/src/modules/{domain}/infrastructure/agent/system-prompt.ts` — add a rule when the tool changes how the agent should behave (e.g. "when a goal completes, offer graduation").
4. Tests: tool behavior + a cross-user isolation test for any user-owned data.

## Hard rules (production lessons — non-negotiable)

- **The agent must never see a `userId`.** Derive it inside `execute` from `authContextStorage.getAuthContext().userId!` (the `userId()` closure in `HealthTools`). Never accept it from tool input.
- **Validate LLM-provided dates** with `localDateStringSchema` before passing to services — tools bypass the HTTP Zod layer.
- **System prompts must be builder functions** evaluated per chat (`buildXSystemPrompt()` + a `get systemPrompt()` getter), never module-level template-literal consts — otherwise "today" freezes at import time.
- Tool name must exist in the shared registry union before use, or both sides fail typecheck.
- `execute` returns serialized results (`jsonTool` JSON-stringifies); mutating tools return the entity snapshot.

## Steps

1. Add the name to the shared union; build shared.
2. Write the failing test (`tdd-workflow`): invoke the tool's `execute` with a faked auth context + fake services/repos, assert it calls the right service with the derived `userId` and never trusts input identity.
3. Implement the `jsonTool` entry until green.
4. Update the system prompt if behavior changes.
5. Add the cross-user isolation test.

## Self-check

- `userId` derived inside `execute`, never from input.
- Dates validated with `localDateStringSchema`.
- Name in the shared registry; typecheck green on both sides.
- System prompt still a builder function.

## Verification

`pnpm --filter @vdp/shared build` → `pnpm typecheck` → `pnpm --filter @vdp/server test:unit` → e2e if the agent chat path changed. Then `code-review`.
