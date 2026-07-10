---
name: smoke-verify
description: Owner-run pre-merge browser smoke for a PR with a UI surface, including surgical cleanup. Invoke during Architect review when the owner asks for the live smoke; do not auto-run it inside a dev-agent implementation session. Hard rules on dev data — the owner uses the dev account with real data.
---

# smoke-verify

The working agreement (`AGENTS.md` / `docs/WORKFLOW.md`) places the manual browser
smoke in **owner + Architect PR review**, after the dev agent has opened a verified
PR. It is not part of the dev-agent `tdd-workflow → open-pr` closing path. This is
the owner-run procedure and its hard rules.

## Preconditions

1. Dev DB up: `docker start vdp-postgres-dev` (port 55432, `vdp:vdp`, db `vdp`).
2. Migrations applied: `DATABASE_URL='postgresql://vdp:vdp@localhost:55432/vdp' pnpm db:migrate` from `server/`.
3. App running: `pnpm dev` (Vite on :3000 proxies `/api` to Fastify on :4000).
   Confirm with `curl -s http://localhost:4000/api/health` before opening a browser.

## Driving the app

- Prefer the harness's preview/browser tooling; verify with text-based inspection
  (snapshots, console, network) over screenshots where possible.
- **Gotcha:** synthetic clicks/typing from browser automation do NOT register on
  this app. Drive interactions by evaluating JavaScript in the page: dispatch
  native events and submit forms via `form.requestSubmit()`.
- Auth: screens sit behind `AuthGate`. Never type, print, or read credentials into
  the transcript; `.claude/dev-credentials.env` stays private (AGENTS.md §Safety).
  If login cannot be performed, hand the owner a precise manual checklist instead
  and say exactly what remains unverified.
- Agent chat requires a local LLM provider configuration for a local smoke.
  Production chat exists, but local sessions never smoke or mutate production.

## What to smoke

The new feature's happy path end-to-end through the real HTTP layer, plus one
error/edge path (e.g. a validation rejection). Watch the browser console and the
server log for errors while doing it — silence is part of the pass.

## Cleanup — hard rules

- **The owner actively uses the app on the dev account with real personal data.
  Never bulk-delete, truncate, or reseed the dev DB.**
- Delete exactly what the smoke created, by id, via targeted SQL
  (`PGPASSWORD=vdp psql -h localhost -p 55432 -U vdp -d vdp`) or the app's own
  delete affordances. Remember side effects: cross-domain event handlers may have
  created tasks/insights from your smoke actions — clean those too.
- Re-query afterwards to confirm the cleanup landed, and say so in the summary.

## Stop conditions

If any precondition can't be met (Docker down, no browser, no credentials), do not
fake the smoke: report exactly which step is unverified and why, per
AGENTS.md §Verification.
