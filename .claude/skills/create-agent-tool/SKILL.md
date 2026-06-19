---
name: create-agent-tool
description: Scaffold one LLM agent tool for an existing domain agent (typed registry entry, tool factory over CQBus + auth context, system-prompt rule, and tests). Use when the owner asks to add or expose an agent tool for a domain.
---

# create-agent-tool

Scaffolds one tool on an existing domain agent, following `HealthTools`/`tasks` reference shape. Agent tools are factory functions over `CQBus` + `AuthContextStorage` that execute the same `Command`/`Query` handlers used by HTTP and return serialized results. Do not pass `ServiceProvider` into tools; cross-domain reads go through CQBus queries.

## Inputs (ask if missing)

- **domain** (tasks, wallet, health — the agents that exist).
- **tool name** in `snake_case` (`archive_goal`).
- which **Command/Query** it executes and the tool's input schema.
- whether it reads or mutates (mutating tools usually return the affected entity's snapshot).

## Files to create / touch

1. `packages/shared/src/constants/agent-tools.ts` — **add the name to the domain's tool-name union FIRST** (both server definitions and web tool handling typecheck against it). `pnpm --filter @vdp/shared build`.
2. `server/src/modules/{domain}/infrastructure/agent/tools.ts` or `tools/{group}-tools.ts` — add a `jsonTool({...})` entry: name, description (written for the LLM), `inputSchema`, and an `execute` that validates tool input and calls `bus.execute(new UseCase(...), executionContextFromAuth(authContextStorage.getAuthContext()))`.
3. `server/src/modules/{domain}/infrastructure/agent/system-prompt.ts` — add a rule when the tool changes how the agent should behave (e.g. "when a goal completes, offer graduation").
4. Tests: tool behavior + a cross-user isolation test for any user-owned data.

## Hard rules (production lessons — non-negotiable)

- **The agent must never see a `userId`.** Build an `ExecutionContext` inside `execute` from `authContextStorage.getAuthContext()` via `executionContextFromAuth(...)`. Never accept identity from tool input.
- **Validate LLM-provided dates** with `localDateStringSchema` before dispatching commands/queries — tools bypass the HTTP Zod layer.
- **System prompts must be builder functions** evaluated per chat (`buildXSystemPrompt()` + a `get systemPrompt()` getter), never module-level template-literal consts — otherwise "today" freezes at import time.
- Tool name must exist in the shared registry union before use, or both sides fail typecheck.
- `execute` returns serialized results (`jsonTool` JSON-stringifies); mutating tools return the entity snapshot.
- Prefer one tool call → one CQBus request. Compose only when the product behavior is explicitly a tool-level flow (e.g. create task with similarity warning).

## Steps

1. Add the name to the shared union; build shared.
2. Write the failing test (`tdd-workflow`): invoke the tool's `execute` with a faked auth context and fake bus/handlers, assert it dispatches the right Command/Query with auth-derived identity and never trusts input identity.
3. Implement the `jsonTool` entry until green.
4. Update the system prompt if behavior changes.
5. Add the cross-user isolation test.

## Self-check

- `ExecutionContext` created inside `execute`, never from input.
- Dates validated with `localDateStringSchema`.
- Name in the shared registry; typecheck green on both sides.
- System prompt still a builder function.

## Verification

`pnpm --filter @vdp/shared build` → `pnpm typecheck` → `pnpm --filter @vdp/server test:unit` → e2e if the agent chat path changed. Then `code-review`.
