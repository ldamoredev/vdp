# VDP Roadmap

Forward-looking only. Shipped work is not narrated here — check `git log`/`git blame`
for how and when something landed. For setup and commands see
[`README.md`](./README.md). For architecture, module rules, agent rules, safety, and
verification guidance see [`AGENTS.md`](./AGENTS.md).

## Scope Snapshot

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable reference module; production-ready for personal daily use |
| Wallet | ✅ | ✅ | ✅ | Active; newer than Tasks, lighter frontend coverage |
| Health | ✅ | ✅ | ✅ | Active: habits, counters, goals, weight trend, daily mood/energy check-ins, and private medical records section; medical has no agent by design |
| Projects | ✅ | ✅ | — | Active direction, board, client catalog, time tracking, hours report, and expected-income link to Wallet |
| Objectives | ✅ | ✅ | — | Active Life Goals layer: quarterly/annual objectives with achieved detection plus manual, Projects-hours, completed-tasks, and Wallet-savings read-time progress |
| Inbox | ✅ | ✅ | — | Active: frictionless capture + pending queue (Bandeja) + triage routing to Tasks/Wallet via prefilled deep-links + LLM-powered smart triage suggestion (never auto-routes) |
| People | — | Disabled demo page | — | Inactive |
| Work | — | Disabled demo page | — | Inactive |
| Study | — | Disabled demo page | — | Inactive |

The agent layer (Tasks) is proactive: an auto-authored daily brief and weekly prep seed
the chat on `/home`/`/review`, and stuck/overloaded-task insights are folded into that
brief as concrete nudges. Medical stays off the LLM by design.

## Status

All six product directions scoped in mid-2026 (cross-domain density, the Today
command center, Work/Projects, Life Goals, Universal Inbox, the proactive agent) have
shipped, except one deliberately-parked item:

- **R4 — Unify `/home` + `/review` into one "Today" surface.** NOT STARTED, and
  possibly not worth doing — see below.

Everything else (D1–D6 and their slices) is done; treat the codebase and commit
history as the record of what shipped and why, not this file.

### R4. Unify /home + /review into one "Today" surface — NOT STARTED (maybe skip)

The original D2 ask was one daily surface with morning/evening phases by time of day.
`/home` and `/review` already cover the morning-plan / evening-close split as two
separate, working screens with shared server-backed ritual state
(`daily_review_state`), so merging them is a refactor of things that already work, not
a capability gap. Highest risk/effort-to-value ratio of anything left. Revisit only if
having two screens instead of one becomes an actual daily friction point — don't do it
speculatively.

## Data Constraint

Tasks production-readiness is complete. Do not assume production data is
disposable without an explicit owner decision; new migrations should be
forward-only unless the owner calls out a local disposable reset.
