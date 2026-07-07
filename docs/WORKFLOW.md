# Multi-Agent Workflow

How the owner's agent fleet works on VDP. [`AGENTS.md`](../AGENTS.md) is the source
of truth for architecture/safety rules; this doc defines **who does what and how a
session runs**. If they ever conflict, AGENTS.md wins — fix it first, then this.

## Roles

| Role | Who | Responsibilities |
|---|---|---|
| **Architect** | Claude Code **Opus 4.8** + the owner | Product/architecture decisions, scoping ROADMAP items, reviewing every PR, triaging §Needs owner decision, docs on `main`. Does not implement features except live with the owner. |
| **Dev agents** | Claude Code **Sonnet 5** · Codex **GPT 5.5** · opencode **Kimi K2.7-code / GLM 5.2** | One ROADMAP item per session, on a feature branch, delivered as a PR. Senior-dev autonomy inside the item's scope; zero authority over scope, product, or `main`. |
| **Owner** | Human | Assigns items, runs browser smokes, decides §Needs owner decision, merges PRs, deploys, runs backups. |

Note: this table is about **coding agents working on the repo**. VDP's *in-app* LLM
provider (`OPENAI_COMPAT_MODEL`) is a separate concern — see ROADMAP F1.6.

## Task routing

- **Scoping, architecture, reviews, product analysis, ROADMAP/docs** → Architect.
- **Well-specified ROADMAP items** (the normal case — every item carries why/scope/
  out-of-scope/done-when) → any dev agent; the owner assigns per item.
- **Mechanical batch work** (pattern migrations, missing tests, lint sweeps) →
  opencode agents first (cheapest), spec'd tightly by the Architect.
- **Anything touching auth, money aggregation, or medical isolation** → any dev
  agent may implement, but the Architect review is mandatory line-by-line (these
  are the rules in AGENTS.md whose violation is invisible in a green CI).

## Dev-agent session protocol

**Read, in order (mandatory):**
1. [`AGENTS.md`](../AGENTS.md) — architecture, module rules, safety, verification.
2. [`ROADMAP.md`](../ROADMAP.md) — take the item the owner assigned (or the top
   unassigned item in phase order if told "take the next one").
3. The skills that apply: `tdd-workflow` and `code-review` are always-on guards;
   generators (`create-handler-api`, etc.) when scaffolding; skills live in
   `.claude/skills/` mirrored at `.agents/skills/` for non-Claude agents.
4. [`PRODUCT_ANALYSIS.md`](../PRODUCT_ANALYSIS.md) only if the item requires
   product judgment (it shouldn't — escalate instead, see below).

**Execute:**
1. Branch from fresh `main`: `feat/<item-id>-<slug>` (e.g. `feat/f1-2-usage-instrumentation`).
   Use `fix/`, `refactor/`, `docs/` prefixes when the item is of that kind.
2. TDD per the `tdd-workflow` skill. Ship the item complete through the per-feature
   gate in AGENTS.md (backend + shared contracts + frontend + tests + migration +
   docs) — a partial item is a failed session, not a smaller PR.
3. Run the verification ladder (AGENTS.md §Verification), targeted first.
4. Self-review the diff with the `code-review` skill; fix or explicitly note
   accepted findings in the PR body.
5. Commit in logical conventional commits (hook-enforced format; imperative
   messages explaining the why). Committing/pushing **on the feature branch** needs
   no per-commit permission — protection lives at the merge.
6. Push the branch and open the PR: `gh pr create --fill` (the repo PR template
   drives the body). CI runs the full ladder on every PR.
7. **STOP.** Summarize for the owner: what shipped, what was verified and how,
   anything noted for review. Never merge, never push `main`, never deploy, never
   touch prod data.

**Escalation — when a product/scope decision appears mid-session:**
Append it to `ROADMAP.md` §Needs owner decision as one bullet: date, the question,
one line of context, and the agent's recommendation. Then continue with whatever
part of the item is decidable; stop the session only if fully blocked. Never decide
product questions unilaterally, never widen scope to route around the question.

## Review & merge protocol (Architect session)

1. Owner + Architect review each PR: the `code-review` skill's three passes over
   the PR diff (design / repo rules / tests). For large or risky PRs the owner may
   run `/code-review ultra <PR#>` (multi-agent cloud review) first and triage its
   findings together.
2. Findings go as PR comments (file:line + rule/smell + suggested fix). The
   authoring dev agent fixes on the same branch in a follow-up session.
3. When the feature has a UI surface, the owner runs the browser smoke on the
   branch (`smoke-verify` skill) before merging, and cleans smoke data surgically.
4. **Owner merges** (rebase-merge to keep the logical conventional commits and a
   linear history; no squash — it destroys the backend/frontend/docs split).
5. Post-merge: ROADMAP entry removed/condensed by the Architect; deploy (with
   migrations) stays owner-run per AGENTS.md.

Start discipline: **one PR in flight at a time.** Parallel PRs only when the items
touch disjoint modules AND neither adds a table (the `SETUP_SQL`/`truncate()`
snapshot in `server/src/test/test-database.ts` is a shared file that conflicts).

## opencode model policy

Default dev model on the Go plan: **Kimi K2.7-code** (code-tuned, K2 lineage is
the strongest open line for agentic coding). GLM 5.2 showed excellent analysis
quality on this repo but is unproven here as an implementer.

This default is provisional until the bake-off: F1.3 (Kimi K2.7-code) vs F1.4
(GLM 5.2) — two comparable Objectives items. The Architect scores both PRs on:
gate completeness, review findings count/severity, test quality, AGENTS.md rule
adherence, and number of review round-trips. Winner becomes the opencode default;
the loser stays as fallback for mechanical batch work.

## Enforcement

`main` is branch-protected on GitHub: merging a PR requires the `ci` check green
and an up-to-date branch. Admin pushes bypass the protection (all agents run under
the owner's credentials, so this cannot physically distinguish agent from owner) —
the no-direct-push rule for implementation sessions is therefore enforced by this
doc, AGENTS.md, and the repo hooks, with the protection as the merge-quality gate.

## What every agent must never do

Unchanged from AGENTS.md §Safety, plus the workflow-specific ones: push to `main`,
merge a PR, deploy, run anything against prod, read `.env*`/secrets, bulk-delete
dev data (the owner's dev account has real data), commit `backups/` or
`vdp-export-*/` output.
