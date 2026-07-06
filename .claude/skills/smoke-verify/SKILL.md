---
name: smoke-verify
description: How to run the manual browser smoke that closes every feature session, and how to clean up after it. Invoke automatically after local verification passes and before claiming a feature done, or when the owner asks for a live smoke. Hard rules on dev data — the owner uses the dev account with real data, so cleanup must be surgical.
---

# smoke-verify

The working agreement (CLAUDE.md / AGENTS.md §Working Agreement) requires a manual
browser smoke against the real app before a feature is claimed done, after the
automated verification ladder (AGENTS.md §Verification) is green. This is the
procedure and its hard rules.

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
- Agent chat only works locally with an LLM provider configured; production has
  none, so never "verify" agent behavior against prod.

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
