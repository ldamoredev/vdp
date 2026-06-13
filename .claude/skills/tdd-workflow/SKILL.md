---
name: tdd-workflow
description: How to drive changes test-first in this repo. Test-first always in principle, for unit/social tests only (integration and e2e are written as verification, not necessarily first); bugfixes start with a failing regression test. Invoke automatically when implementing a feature, fixing a bug, or writing tests, and follow the layer order and stop conditions here.
---

# tdd-workflow

The operating rules for writing tests in this codebase. Test-first **in principle, with judgment** — not a mechanical ritual. Applies to non-integration/non-e2e tests; integration and e2e suites are written as verification of a flow, not necessarily before the code.

## The loop

Red → green → refactor, one small step at a time:

1. **Red** — write the smallest failing test that states the next behavior. Run it; confirm it fails for the right reason.
2. **Green** — write the least code that makes it pass. Don't add untested behavior.
3. **Refactor** — clean up with the test green (this is where `code-review`'s design lenses apply). Re-run.

Stop condition: **do not write the next layer until the current one is green.** Don't batch five tests then implement; go one behavior at a time.

## What to test first, by change type

Follow the layers outward; each has a natural test style and double:

- **Domain** (`core/domain`, `server/.../domain`) — pure unit tests, no doubles. Entities, value objects, collection functions. First and always.
- **Application / use case** (`core/app`, `server/.../services`) — unit/social tests with **fakes** (fake gateway, fake repository in `__tests__/fakes/`), not mocks. Drive the handler/service through its collaborators' real interfaces.
- **Presenter** (`ui/screens/.../*Presenter`) — unit tests with no React: a fake-gateway-backed Core, assert ViewModel transitions, busy flags, lifecycle (start/stop idempotent), label formatting.
- **Infrastructure adapter** (`Http*Gateway`, Drizzle repos) — gateway: fake `HttpClient`; Drizzle repo: real Postgres (integration), written as verification.
- **HTTP / flow** — e2e (`__tests__/e2e`) as verification of the wired path, after the units are green.

## Mocks vs fakes (this repo's stance)

Prefer **fakes** (real behavior, in-memory) over mocks (London-style interaction assertions) for collaborators. Fakes give classical/Detroit-style tests that survive refactors. Use a spy/stub only to force an error path or assert a fire-and-forget call. The repo convention puts fakes in `{domain}/__tests__/fakes/`.

## Bugfixes

Regression-test-first: write a test that reproduces the bug and fails, then fix until green. Keep the test. (Example from A2: `createAppCore.test.ts` was added to catch the unregistered-handler class of bug.)

## Test quality bar (FIRST + readable)

- **Fast, Isolated, Repeatable, Self-validating, Timely.**
- One behavior per test; name the behavior, not the method (`reloads when habitsChanged fires`, not `test habitsChanged`).
- Given-When-Then shape; arrange with builders/factories over inline literals.
- Pin time with `vi.useFakeTimers()` + `vi.setSystemTime()` for unit; use real clock + relative helpers (`daysAgo(n)`) for e2e.
- A test that can't fail tests nothing — confirm red before green.

## Verification ladder

Targeted first, broaden as risk warrants: the single new test file → the module's suite → `pnpm typecheck` → full `pnpm --filter @vdp/web test` / `pnpm --filter @vdp/server test:unit` → DB-backed suites only when the code touches the DB. Don't run the whole pyramid for a one-line change.

## Reference reading

[Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), [Test Desiderata](https://medium.com/@kentbeck_7670/test-desiderata-94150638a4b3), [Programmer Test Principles](https://medium.com/@kentbeck_7670/programmer-test-principles-d01c064d7934), [Ten I-statements about TDD](https://www.geepawhill.org/2021/08/03/ten-i-statements-about-tdd/), [TDD guided by ZOMBIES](https://blog.wingman-sw.com/tdd-guided-by-zombies), [London vs Detroit](https://blog.ncrunch.net/post/london-tdd-vs-detroit-tdd.aspx), [Mock Roles not Objects (jMock)](https://jmock.org/oopsla2004.pdf), [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), [Test Contravariance](https://blog.cleancoder.com/uncle-bob/2017/10/03/TestContravariance.html), [Test Definitions](https://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.html), [10 classic TDD mistakes](https://www.linkedin.com/pulse/10-classic-tdd-mistakes-jason-gorman/), [FIRST](http://jmbarroso.es/2012/01/en-testing-lo-primero-es-f-i-r-s-t/), [readable tests (AssertJ)](https://adictosaltrabajo.com/2016/03/16/tests-mas-legibles-con-assertj/), [naming test classes & methods](https://www.codurance.com/publications/2014/12/13/naming-test-classes-and-methods), [Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html), [parameterized tests](https://www.baeldung.com/parameterized-tests-junit-5), [Introducing BDD](https://dannorth.net/blog/introducing-bdd/), [IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html), [Humble Object](http://xunitpatterns.com/Humble%20Object.html), [MVP guidelines](https://medium.com/@cervonefrancesco/model-view-presenter-android-guidelines-94970b430ddf), [characterization testing](https://michaelfeathers.silvrback.com/characterization-testing), [e2e with node](https://marmelab.com/blog/2016/04/19/e2e-testing-with-node-and-es6.html), load testing ([load vs stress](https://www.loadview-testing.com/learn/load-testing-vs-stress-testing/), [Artillery intro](https://www.testim.io/blog/artillery-load-testing-introduction-see-how-your-code-scales/), [Artillery core concepts](https://www.artillery.io/docs/get-started/core-concepts)).
