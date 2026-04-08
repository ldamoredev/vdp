# Product Clarity and Real Value — Design Spec

Date: 2026-04-08
Status: Approved direction, ready for implementation planning
Supersedes (in part): `2026-04-05-project-priorities-design.md` — this spec keeps the same spirit (two-domain confidence first, restraint on new domains) but reframes the phase around a single-user reality and a concrete daily ritual.

## Purpose

Clarify what VDP is for, audit what currently delivers real value across the two active modules (Tasks and Wallet), and define a focused next phase that makes the product feel trustworthy, fast, and quietly intelligent in daily use.

## Vision

VDP is a personal operating system for one user (Lautaro). Its job is to make two daily loops — running the day (Tasks) and handling money (Wallet) — feel fast, trustworthy, and quietly intelligent, and to collapse them into a single daily ritual that closes the day, surfaces what was missed, and sets up tomorrow. Every feature must serve one of those two loops or the ritual that joins them. Nothing else qualifies as real value.

Three implications this vision enforces:

- **Single-user reality.** Multi-tenant work, generic abstractions, and "future user" hypotheticals are not value. They are cost.
- **Two loops, one ritual.** Tasks and Wallet are not independent products. Wallet must reach Tasks' confidence bar so the ritual has two trustworthy halves.
- **Quietly intelligent, not flashy.** The assistant earns its place by reducing friction in the loops, not by adding new surfaces.

## Value Audit

### Tasks — the strong loop

**Real value (keep and protect):**

- `/tasks` daily operational center — fast, dense, dual-layout. Most-used surface.
- `/tasks/history` decision flow (carry-over, discard, inspect) — directly serves the "decide tomorrow" instinct.
- Domain-aware assistant with persisted conversations and Spanish error messages — friction reducer, not a toy.
- Live task insights via SSE — actionable when scoped per-user.
- Similarity search via pgvector — quietly useful for the assistant.

**Possibly noise (re-examine):**

- Anything in Tasks UI that exists "for completeness" but is not used weekly.
- Insights that surface but never change a decision.
- Assistant capabilities that are not actually invoked.

**Verdict:** Tasks is at the bar. It is not touched in this phase except where it is needed to serve the daily ritual.

### Wallet — the weak loop

**Real value (keep):**

- The fact that the backend is broadly implemented — services, repos, agent tools, HTTP surface. The substrate exists.
- Spending spike detection — the idea is right; it is the kind of "notice" the daily ritual needs.
- Wallet dashboard entry points on home — the seams exist.

**Broken or weak:**

- **Capture friction.** Logging an expense is not yet as fast and natural as adding a task. It does not match how money moments actually happen (out, mobile, 5 seconds).
- **Trust gap.** Categories, totals, and trends do not yet feel obviously correct. The user does not fully believe what Wallet reports.
- **Visual roughness.** Screens do not match Tasks' density, badge language, or polish. Wallet feels newer, which makes it feel less trustworthy even where the data is fine.

**Probably noise (cut or defer):**

- Any Wallet feature that does not serve capture, trust, or polish in this phase.
- Frontend surfaces that exist because the backend supports them, not because they are used.
- Test coverage work on Wallet flows that are about to be reshaped — wait until the shape is settled.

### The seam — Tasks ↔ Wallet today

**Real value:** Almost none yet. Home was reframed around Tasks + Wallet, but the two halves still feel adjacent rather than joined. There is no daily ritual screen.

**The gap:** No moment in the product where using Tasks and Wallet together is better than using them apart. Closing this gap is the entire reason this phase exists.

### Shell, auth, infra

**Real value:** Shared shell chat, login, deploy pipeline, observability — these all work and are quietly load-bearing.

**Reframe:** Core Trust becomes "never lose my data, never silently break." Backups, error visibility, deploy health. Not multi-tenant isolation. Not session-management theatre.

## Phase Plan

Four tracks in priority order, plus one parallel standing rule.

### Track 1 — Wallet Capture (the 5-second expense)

**Goal:** Logging an expense feels as fast as adding a task. No exceptions — same speed bar.

**What this means:**

- One primary capture path that works from anywhere in the product (chat, keyboard shortcut, mobile-friendly form).
- Capture takes amount + category + optional note in under 5 seconds, with smart defaults pulled from history.
- The chat assistant can capture an expense from a free-text sentence ("gasté 3500 en nafta") and confirm it inline.
- Mobile capture works without zooming, scrolling, or hunting.

**Done signal:** Real expenses get logged in the moment they happen, on mobile, without thinking about the UI. Expense entries stop being deferred.

**Out of scope:** Receipt scanning, OCR, bank sync, multi-currency. None of these serve the 5-second bar in this phase.

### Track 2 — Wallet Trust (data you believe)

**Goal:** Every number Wallet shows is obviously correct, or obviously fixable in two clicks.

**What this means:**

- A clean edit/recategorize flow for any expense, accessible from every surface that displays one.
- Category totals reconcile with the underlying expenses — no silent rounding, no hidden filters, no "where did that number come from."
- A small "sanity panel" per view: count of expenses, sum, date range. Visible, boring, correct.
- Spending spike insights cite the underlying expenses they are based on, so they can be verified in one click.
- A "fix the data" flow for moments when something looks wrong — one command, one path, no dead ends.

**Done signal:** When Wallet reports something, the reaction is "right" or "let me fix that," never "I do not know if I trust this."

**Out of scope:** Complex analytics, projections, forecasting. Trust comes from correctness, not sophistication.

### Track 3 — Wallet Polish (visual parity with Tasks)

**Goal:** Wallet screens feel like the same product as Tasks — same shared components, same density, same badge language, same dual-layout discipline.

**What this means:**

- Wallet adopts the same shared badge / row / card components Tasks uses.
- Desktop and mobile layouts mirror Tasks' density and information hierarchy.
- Spanish copy, error messages, and empty states match Tasks' tone.
- No "newer" smell — colors, spacing, typography, transitions are coherent.
- The shared shell chat treats Wallet questions with the same polish as Tasks ones.

**Done signal:** Switching from `/tasks` to `/wallet` does not feel like a step down. A stranger could not tell which module shipped first.

**Out of scope:** Redesigning Tasks. Introducing a new design system. Animation work that does not reduce friction.

### Track 4 — The Daily Review Ritual (Tasks ↔ Wallet collapse into one)

**Goal:** A single screen, one flow, ~2 minutes, that runs the close → notice → decide ritual across both modules.

**What this means:**

- **Close the day:** mark today's tasks as done/carried/dropped, confirm today's expenses are accounted for, acknowledge anomalies.
- **Notice:** the screen surfaces (a) tasks that drifted, (b) spending spikes or category overruns, (c) anything the assistant flagged that has not been acknowledged. Each item is one-click-actionable from the review screen — no jumping to other pages.
- **Decide tomorrow:** carry-over choices for tasks, "watch this category" choices for Wallet, optional note capture.
- One ritual entry point on home. One chat command to start it. Persistent state if interrupted.
- The assistant can run the review conversationally as an alternative to the UI — same outcomes either way.

**Done signal:** The ritual actually happens most days, in roughly two minutes, and the next morning the product feels prepared instead of stale.

**Out of scope:** Weekly reviews, monthly reports, retrospectives, gamification. The daily ritual must work first.

### Parallel standing rule — Core Trust (reframed)

Runs alongside all four tracks. **Not a phase, not a milestone — a standing rule.**

**Scope:** "VDP never loses my data and never silently breaks."

- Database backups verified and restorable.
- Production error visibility (regressions surface before the user encounters them).
- Deploy health checks that catch regressions before they reach the user.
- The minimum CI gates that protect the two loops.

**Out of scope:** Multi-user isolation. Session management hardening for hypothetical users. Auth UX work. Generic platform safety.

## Sequencing Rules

1. **Tracks 1, 2, 3 are gates for Track 4.** The daily ritual cannot start until Wallet can carry its half. Capture, trust, and polish must all be at "done signal" before the ritual screen begins.
2. **Tracks 1, 2, 3 can interleave.** A fix that touches all three at once (e.g., a recategorize flow that improves capture, trust, and polish together) is the best kind of work.
3. **Core Trust is always-on, never a phase.** No track is allowed to skip it; no track is allowed to expand into it.
4. **Domain restraint stays absolute.** Health, People, Work, and Study do not activate in this phase. The architecture making it easy to add them is not a reason to add them.
5. **Decision rule for any new work:** *"Does this serve one of the two loops or the ritual that joins them?"* If no, it does not ship in this phase.

## Non-Goals

- Activating Health, People, Work, or Study.
- Multi-user features, multi-tenant isolation, or auth UX hardening for hypothetical users.
- Receipt OCR, bank sync, multi-currency, forecasting, or other Wallet sophistication.
- Tasks redesign or new Tasks features beyond what the daily ritual requires.
- Broad refactors without direct payoff to the two loops.
- Generic orchestration, plugin systems, or platform abstractions.

## Success Definition

This phase is successful when:

- Wallet feels as fast, trustworthy, and polished as Tasks. There is no "step down" between them.
- Expenses are captured in the moment they happen, including on mobile.
- Wallet's numbers are believable on sight, and obviously fixable when they are not.
- The daily review ritual is real: one screen, ~2 minutes, used most days, replacing scattered checks across Tasks and Wallet.
- Production never silently breaks, and data is never lost.
- The next planning cycle can honestly evaluate whether to deepen further or activate a new domain — and the answer is no longer obvious.

## Risks

- **Wallet repair expanding into a redesign.** Mitigation: each track has a "done signal" and an explicit out-of-scope list.
- **The daily ritual starting too early.** Mitigation: explicit gate — Tracks 1–3 must reach done before Track 4 begins.
- **Core Trust expanding into a platform program.** Mitigation: it is a standing rule, narrowly scoped, never a phase.
- **Domain temptation.** Mitigation: Health, People, Work, Study are non-goals for this entire phase, full stop.
