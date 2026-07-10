---
name: code-review
description: "Review the working-tree diff before committing or pushing. Runs three passes — design (SOLID/DRY/Demeter/hexagonal/DDD…), repo rules (AGENTS.md + architecture docs), and tests. Any finding is a warning that blocks commit/push: report it to the owner and wait. Invoke automatically before any commit or push, and whenever the owner asks to review changes."
---

# code-review

Reviews the current change for design, repo-rule, and test problems before it is committed. Principles are **orientation, not dogma** — be criterioso: a finding that technically violates a rule but is right here should be noted as acceptable with the reason, not forced.

## When to run

- Automatically **before any `git commit` or `git push`** of non-trivial code, and as the `open-pr` skill's gate before a PR.
- Whenever the owner asks to review the diff or a module, and during the Architect's PR review (`docs/WORKFLOW.md`).

## Effort tiers

Match the review effort to the diff's risk — don't run a heavy pass on a copy tweak, don't wave through an auth change. Default to **medium**.

- **content-only** — the diff is only CSS, copy/emoji, comments, or docs/skills (`**.md`, `.claude/**`). **Skip review**; state that you skipped it and why. (This is also `open-pr`'s trivial path — direct push, no PR.)
- **medium** (default) — a routine, slice-sized code diff. Run **the three passes below inline**. This is what a dev agent runs on its own diff and what the Architect runs on a normal PR.
- **high** — a large diff, or one touching a **risk surface**: auth-context, money aggregation (currency), medical isolation, a migration / schema change, or a new cross-module coupling. The Architect escalates to the **fan-out** below. A dev agent that finds itself on a risk surface says so in the PR body so the Architect knows to go high.
- **ultra** — the owner-invoked `/code-review ultra` cloud review. Cannot be launched from a session; only the owner triggers it, typically on a big or risky PR (`/code-review ultra <PR#>`).

The severity model and three passes are the same at every tier; the tier changes *how much machinery* runs, not what counts as a finding.

## Severity model (single level)

There is one severity: **warning**. Any warning means:

1. **Do NOT commit or push.**
2. Report the findings to the owner, grouped by section, each with `file:line`, the principle/rule involved, and a one-line fix or judgment call.
3. Wait for the owner. They decide what to fix vs. accept.

If the review finds nothing, say so plainly and proceed.

## Scope

Default to the working-tree diff: `git diff HEAD` (staged + unstaged) plus untracked files in the change. If the owner names a module or PR, review that instead. Review only what changed and its immediate blast radius — not the whole repo.

## The three passes

### 1. Design

Judgment-based. Read the changed code and ask whether it holds up against these lenses. Cite the specific smell, don't just name-drop a principle.

- **SOLID** — single responsibility (is this class/presenter/handler doing one job?), open/closed, Liskov, interface segregation, dependency inversion (depend on ports, not concretions).
- **Cohesion & coupling** — Law of Demeter (don't reach through objects), Tell-Don't-Ask (push behavior into the object that owns the data, not getters + external logic), connascence (prefer weak/local coupling).
- **Duplication** — DRY, but distinguish *incidental* duplication (two things that look alike by coincidence) from real duplication; don't abstract incidental dup.
- **YAGNI / simplicity** — no speculative generality, no code without a consumer. Beck's four rules of simple design (passes tests, reveals intent, no duplication, fewest elements).
- **Domain modeling** — avoid the Anemic Domain Model where behavior belongs on the entity; rich-vs-plain is a deliberate choice (see AGENTS.md dual-style). DDD tactical patterns (entities, value objects, aggregates) and strategic boundaries.
- **Architecture boundaries** — hexagonal ports & adapters (domain knows no infrastructure), modular-monolith module boundaries (no reaching into another module's internals), CQS (commands vs queries separated; the Command pattern as used by the CQBus).
- **ETC** — "easier to change": does this make the next change easier or harder?

Reference reading (citations, not required per-review): [SOLID/CUPID/GRASP](https://www.boldare.com/blog/solid-cupid-grasp-principles-object-oriented-design/), [Law of Demeter](https://es.wikipedia.org/wiki/Ley_de_Demeter), [ETC](https://medium.com/@zayminmaw/e-t-c-the-forgotten-principle-321d827268ec), [YAGNI](https://martinfowler.com/bliki/Yagni.html), [DRY & incidental duplication](https://anthonysciamanna.com/2018/07/28/the-dry-principle-and-incidental-duplication.html), [Tell Don't Ask](https://martinfowler.com/bliki/TellDontAsk.html), [Beck design rules](https://martinfowler.com/bliki/BeckDesignRules.html), [CQS](https://martinfowler.com/bliki/CommandQuerySeparation.html), [Command pattern](https://refactoring.guru/design-patterns/command), [Anemic Domain Model](https://www.martinfowler.com/bliki/AnemicDomainModel.html), Kamil Grzybek modular monolith ([primer](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer), [integration styles](https://www.kamilgrzybek.com/blog/posts/modular-monolith-integration-styles), [domain-centric design](https://www.kamilgrzybek.com/blog/posts/modular-monolith-domain-centric-design), [enforcement](https://www.kamilgrzybek.com/blog/posts/modular-monolith-architecture-enforcement)), hexagonal ([Cockburn](https://alistair.cockburn.us/hexagonal-architecture), [OCTO](https://blog.octo.com/en/hexagonal-architecture-three-principles-and-an-implementation-example)), Vaadin DDD ([strategic](https://vaadin.com/blog/ddd-part-1-strategic-domain-driven-design), [tactical](https://vaadin.com/blog/ddd-part-2-tactical-domain-driven-design), [+ hexagonal](https://vaadin.com/blog/ddd-part-3-domain-driven-design-and-the-hexagonal-architecture)), Ian Cooper ([catalogue & CQS](https://web.archive.org/web/20170716214611/http:/codebetter.com/iancooper/2009/10/08/the-catalogue-metaphor-and-command-query-seperation-architectures/), [CRUD may not be what they need](https://web.archive.org/web/20200217152108/http:/codebetter.com/iancooper/2011/07/15/why-crud-might-be-what-they-want-but-may-not-be-what-they-need/)). Plus [Presentation Domain Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html) and [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html).

### 2. Repo rules

These are hard rules — a violation is a warning. Source of truth is [AGENTS.md](../../../AGENTS.md); do not restate them here, check against them. The high-frequency ones:

- **Auth context**: `userId` always from `authContextStorage`/`request.auth`, never from body/params/query/LLM input; cross-user isolation tests for user-owned data.
- **Backend CQBus**: new HTTP-exposed use cases live in `server/src/modules/{domain}/app` as `Command`/`Query` + `RequestHandler`; controllers call `bus.execute(..., executionContextFromAuth(request.auth))`; handlers call `requireUserIdentity(identity)` and Commands/Queries never carry `userId`.
- **Currency**: never sum amounts across currencies; new money aggregations filter or group by currency.
- **Dates**: `getTodayISO()`/`localDateISO()`, never `new Date().toISOString().slice(0,10)`.
- **Entities**: immutable snapshots, `fromSnapshot()`/`toSnapshot()`.
- **DB**: a new table needs the three synchronized changes (Drizzle schema + `db:generate`, `SETUP_SQL`, `truncate()` list).
- **Test placement**: fakes in `{domain}/__tests__/fakes/`, shared DB infra in `server/src/test/`.
- **Frontend**: no React under `core/`; humble views (no logic in JSX beyond VM flags); one presenter per section, not a God-presenter; presenters StrictMode-idempotent; every new frontend module registered in `createAppCore`. Layering ratchet: presentation lives only under `ui/`, and `core/` imports no React or `ui/` (the old `features/`/`pages/`/`components/` layers were removed — see ARCHITECTURE.md §4). Home/review/login/landing/settings-shell remain legacy plain/local screens, but React Query has been fully removed. See [ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) §4.

### 3. Tests

- Coverage of the change at the **right pyramid level** (unit for logic, integration for DB, e2e for flows) — see the `tdd-workflow` skill, which shares this reference set.
- Test quality: FIRST (fast, isolated, repeatable, self-validating, timely), one behavior per test, readable Given-When-Then, descriptive names.
- Fakes vs. real DB placement correct; cross-user isolation present where required.
- For a bugfix: is there a regression test that fails without the fix?

## High-effort fan-out (Architect only)

For the `high` tier, spread the three passes across parallel finder agents — but with a hard-won safety recipe. **The failure to avoid:** finder agents spawned with no `model` set inherit the parent's (expensive) model and re-explore the repo unbounded, burning the session budget with nothing to show. Never do that.

1. **Build one bundle in the scratchpad:** a filtered diff (exclude generated noise — migration snapshot/meta JSON, lockfiles) + a short context card (change intent, the governing AGENTS.md rule, a file map). Every finder gets the *same* bundle — a pure `input → findings` function, not its own repo exploration.
2. **Pick 4–8 angles** the diff actually needs: correctness, removed guards/invariants, cross-file callers (including surfaces the diff doesn't touch but that consume changed types), reuse/simplification, conventions. Mechanical angles (naming, conventions) → a cheap model; substantive ones (correctness, invariants, callers) → a mid model.
3. **Spawn one Agent per angle**, each with: an **explicit `model`** (never omitted/inherited); the bundle from step 1; a **per-angle file allowlist (~4 files max)** — no Grep, no git, no free exploration; and an instruction that its final message is a **JSON array of findings only**.
4. **Verify every candidate inline** in the Architect session — it already holds full context, so don't spawn per-candidate verifiers. Read the actual file; confirm or reject.
5. **Report** only findings that survived verification, most-severe first — same shape as a medium review.

`ultra` is different and not this: it's the owner-triggered cloud review, never launched from here.

## Output format

```
Code review — <N> findings (commit/push blocked)

Design
- path/to/File.ts:42 — <smell>: <one-line explanation>. Fix: <…>  (or: noted, acceptable because <…>)

Repo rules
- path/to/File.ts:10 — <rule from AGENTS.md>: <what's wrong>.

Tests
- path/to/File.test.ts — <gap>: <…>

Verdict: blocked on <N> findings / clean — safe to commit.
```

After reporting, stop and wait for the owner. Do not commit or push while findings stand.
