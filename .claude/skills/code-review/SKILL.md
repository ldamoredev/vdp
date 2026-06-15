---
name: code-review
description: Review the working-tree diff before committing or pushing. Runs three passes — design (SOLID/DRY/Demeter/hexagonal/DDD…), repo rules (AGENTS.md + architecture docs), and tests. Any finding is a warning that blocks commit/push: report it to the owner and wait. Invoke automatically before any commit or push, and whenever the owner asks to review changes.
---

# code-review

Reviews the current change for design, repo-rule, and test problems before it is committed. Principles are **orientation, not dogma** — be criterioso: a finding that technically violates a rule but is right here should be noted as acceptable with the reason, not forced.

## When to run

- Automatically **before any `git commit` or `git push`** of non-trivial code (skip pure docs/config typo fixes).
- Whenever the owner asks to review the diff or a module.

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
- **Currency**: never sum amounts across currencies; new money aggregations filter or group by currency.
- **Dates**: `getTodayISO()`/`localDateISO()`, never `new Date().toISOString().slice(0,10)`.
- **Entities**: immutable snapshots, `fromSnapshot()`/`toSnapshot()`.
- **DB**: a new table needs the three synchronized changes (Drizzle schema + `db:generate`, `SETUP_SQL`, `truncate()` list).
- **Test placement**: fakes in `{domain}/__tests__/fakes/`, shared DB infra in `server/src/test/`.
- **Frontend**: no React under `core/`; humble views (no logic in JSX beyond VM flags); one presenter per section, not a God-presenter; presenters StrictMode-idempotent; every new frontend module registered in `createAppCore`. Layering ratchet: presentation lives only under `ui/`, and `core/` imports no React or `ui/` (the old `features/`/`pages/`/`components/` layers were removed — see ARCHITECTURE.md §4). Note: home/review/login/landing/settings are still legacy React-Query screens under `ui/screens/*` pending migration. See [ARCHITECTURE.md](../../../docs/architecture/ARCHITECTURE.md) §4.

### 3. Tests

- Coverage of the change at the **right pyramid level** (unit for logic, integration for DB, e2e for flows) — see the `tdd-workflow` skill, which shares this reference set.
- Test quality: FIRST (fast, isolated, repeatable, self-validating, timely), one behavior per test, readable Given-When-Then, descriptive names.
- Fakes vs. real DB placement correct; cross-user isolation present where required.
- For a bugfix: is there a regression test that fails without the fix?

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
