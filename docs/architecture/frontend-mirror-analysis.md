# Frontend Mirror Architecture — Analysis & Proposal

Status: draft for owner review (June 2026 architecture session).
Scope: audit findings, proposed frontend structure (presenters + CQBus + Core), Next.js vs Vite trade-off with recommendation, pilot plan, and per-module migration plan. No production code changes in this session.

Related: [AGENTS.md](../../AGENTS.md) (backend architecture rules), [ROADMAP.md](../../ROADMAP.md).

---

## 1. Context and goal

The backend already follows a disciplined modular architecture: a composition root (`server/src/modules/Core.ts`), one service class per use case, repository interfaces with Drizzle implementations and fakes, domain entities, and an event bus. The frontend is disciplined too (feature modules, pure selectors, thin pages) but its logic lives in React hooks and contexts, which makes most of it untestable without React.

Goal: bring the frontend to the same architectural standard by mirroring the reference structure:

- `core/` — `app/` (application services per module, dispatched via CQBus), `domain/` (models), `infrastructure/` (http, auth, sse, storage), unified by a `Core.ts` composition root.
- `ui/` — `screens/`, `components/`, `modals/`, `models/` (ViewModels), `events/`, with **presenters** (Humble Object pattern) owning all UI logic. Views only render and delegate.
- `WebApp.tsx` as the startup that assembles Core + UI.

Non-negotiable testing rules of the target design:

- Every presenter has a unit test (no React, no DOM).
- Every application service has a test.
- Every infrastructure implementation has a test (doubles or test server as appropriate).

## 2. Audit findings (Phase 0 summary)

### 2.1 Monorepo

- `apps/web` — Next.js 15 (App Router), React 19, TailwindCSS v4, React Query v5, vitest + Playwright.
- `server/` — Fastify 5, Drizzle, Postgres. (Note: the API lives at `server/`, not `apps/api`.)
- `packages/shared` — Zod schemas + cross-package types. Both sides typecheck against it.
- Deploy: Vercel (web) + Render (api) + Supabase (Postgres).

### 2.2 Backend is already halfway to the reference architecture

`server/src/modules/Core.ts` is a real composition root (EventBus, AgentRegistry, ServiceProvider, RepositoryProvider, AuthContextStorage, module factories). Each domain has `{Domain}Module` + `{Domain}ModuleRuntime`, one service class per use case, repository ports + Drizzle adapters + fakes. Introducing CQBus there (Arista 3) is a replacement of the homegrown `ServiceProvider` dispatch, not a migration.

### 2.3 Frontend today

Per-feature pattern (consistent across tasks/wallet/health/home/review):

- `{domain}-api.ts` — HTTP functions over a generic `request()` (`lib/api/client.ts`). This is already a primitive gateway.
- `{domain}-selectors.ts` — pure functions; the only unit-test surface without React.
- `use-{domain}-queries.ts` / `use-{domain}-mutations.ts` — React Query owns fetching, caching, invalidation, busy state, **and** form state and flow state (e.g. `graduationOffer` in health).
- `{domain}-context.tsx` — two contexts (data/actions) hand-packing the hooks; ~120 lines of pure plumbing per feature.
- Pages are layout-only (<30 lines). Components consume context.

Pain points the new architecture removes:

- UI logic (forms, busy logic, flows) is untestable without React.
- Adding one field touches ~6 files (api → mutations → two context interfaces → provider → component): shotgun surgery.
- The two-context plumbing is repeated per feature and grows linearly with each action.

### 2.4 Next.js usage is already "shell only"

- All domain pages are `"use client"`. Only 3 server components exist: the public landing (decorative, owner-confirmed), the login page wrapper, and `wallet/transactions` reading `searchParams` (trivially client-replicable).
- Data fetching is 100% client-side via React Query. No RSC data fetching, no server actions.
- What Next actually provides: the cookie BFF (`app/api/proxy/v1/[...path]/route.ts` converts the httpOnly `vdp_session` cookie into `x-session-token`), 9 same-origin auth routes, a middleware redirect to `/login`, PWA metadata, and the anti-flash theme script.
- Coupling of application code to Next across `features/ + components/ + lib/`: **23 files** — 18 are `import Link from "next/link"`, plus 8 `usePathname`/`useRouter` call sites. That is the entire migration surface of app code.

### 2.5 Reference libraries — maintenance and compatibility

| Library | Version | Last publish | Assessment |
|---|---|---|---|
| `@nbottarini/cqbus` | 0.5.4 | Aug 2023 | Dormant but stable; zero framework deps, 27 KB. No React compat concern. Pre-1.0. |
| `@nbottarini/react-presenter` | 1.0.0-rc | Feb 2026 | Active. Source reviewed: React 19 compatible (`useRef`/`useReducer`/`useEffect`, nothing deprecated). Caveats below. |
| `@nbottarini/react-observable` | 1.0.0-rc.4 | May 2026 | Active. Built on `useSyncExternalStore` → concurrent-safe under React 18/19. The most solid of the set. |
| `@nbottarini/http-client` | — | — | Package name does not exist. The repo ships `abstract-http-client` (0.4.2, Oct 2023) and `axios-http-client` (0.9.3, Dec 2024). |

Caveats (verified, not speculation):

1. **`usePresenter` does a top-level `require('@react-navigation/native')` in try/catch** (optional resume/pause lifecycle). Under Vite/ESM this fails at runtime and is caught — fine. Under Next/webpack module resolution happens at build time and can fail the build even inside try/catch; workarounds exist (`IgnorePlugin`/fallback) but it is real friction. Resolution (§9): with Vite chosen, the library is used as published — no publish or vendoring needed.
2. **React StrictMode** double-mounts in dev: presenters will see `start()` / `stop()` / `start()`. Presenters must be idempotent on start/stop. This becomes a written rule in the `create-presenter-web` skill.
3. **`axios-http-client` depends on `axios ^0.27.2`** — an old line with a known CVE (CSRF, fixed in 0.28/1.6); `npm audit` will flag it. Do not adopt it. Use the `abstract-http-client` interfaces and write a `FetchHttpClient` (~100 lines; the app already uses fetch).
4. All four have minimal adoption (~20–290 downloads/month) and two are RCs. The owner authors them, so abandonment risk is self-controlled, but every bug is ours to fix. Vendoring is a viable plan B for all of them (presenter + observable are <80 KB of simple code).

## 3. Conceptual frame: "Modularizing React Applications with Established UI Patterns"

Juntao Qiu's article on martinfowler.com (Feb 2023) is the intellectual basis for this design. Its thesis: *there is no such thing as a React application* — there are TypeScript applications that use React as the view, and the established presentation–domain–data layering applies intact. Key moves in the article, mapped to this proposal:

| Article | This proposal | VDP today |
|---|---|---|
| Views as pure components | `ui/screens`, `ui/components` (humble: render + delegate) | Close — components consume context |
| Hooks as "a state machine behind the view" | **Presenters** (the state machine reified as a plain class) + one generic `usePresenter` | Per-feature query/mutation hooks |
| Domain models with behavior (`PaymentMethod`, `PaymentStrategy`) | `core/domain/{module}` | Anemic pure selectors; rich classes exist only on the backend |
| Network client as gateway / anti-corruption layer | `core/app` services via CQBus + gateways implemented in `core/infrastructure/http` | `{domain}-api.ts` over `request()` |

Two honest notes:

- The article treats React Query as something you may plug *behind* an extracted fetch function — infrastructure, not architecture. That matches the owner's decision: presenters + observables replace RQ's role here.
- The article stops at extracting functions and classes; it does **not** ask for a command bus. CQBus is one deliberate step further, justified by: uniform middlewares (logging, error mapping), symmetry with the API side (Arista 3), and giving the Claude Code skills (Arista 2) a single canonical shape to generate.

The article's portability test — "the React view is only one of the consumers of your non-view code" — is the acceptance criterion for `core/`: nothing under `core/` may import React.

## 4. Proposed structure, with `health` mapped to real files

```text
apps/web/src/
├── main.tsx                          # entry: mounts <WebApp/>
├── WebApp.tsx                        # startup: builds Core, providers, router
├── core/
│   ├── Core.ts                       # composition root: CQBus, gateways, stores, middlewares
│   ├── app/
│   │   └── health/
│   │       ├── GetHabitsOverview.ts  # Query<HabitsOverview> + handler (calls HealthGateway)
│   │       ├── CreateHabit.ts        # Command<Habit> + handler
│   │       ├── CompleteHabitDay.ts
│   │       ├── UncompleteHabitDay.ts
│   │       ├── ArchiveHabit.ts
│   │       ├── GetCountersOverview.ts
│   │       ├── CreateCounter.ts
│   │       ├── RelapseCounter.ts
│   │       ├── ArchiveCounter.ts
│   │       ├── GetGoalsOverview.ts
│   │       ├── CreateGoal.ts
│   │       ├── CompleteGoal.ts
│   │       ├── DropGoal.ts
│   │       └── GraduateGoal.ts       # 1:1 mirror of server/src/modules/health/services/
│   ├── domain/
│   │   └── health/
│   │       ├── Habit.ts              # model over @vdp/shared DTOs; behavior where it earns it
│   │       ├── Counter.ts
│   │       ├── Goal.ts               # e.g. daysLeft(), urgency() — today's selectors become methods
│   │       └── HealthGateway.ts      # port interface (list/create/complete/…)
│   └── infrastructure/
│       ├── http/
│       │   ├── FetchHttpClient.ts    # implements @nbottarini/abstract-http-client
│       │   └── HttpHealthGateway.ts  # implements HealthGateway over HttpClient
│       ├── auth/
│       │   └── SessionAuth.ts        # login/logout/me against the api
│       └── sse/
│           └── InsightsStream.ts     # EventSource → ObservableResource
└── ui/
    ├── events/
    │   └── UIEvents.ts               # e.g. habitsChanged, goalsChanged (observables) — replaces RQ invalidation
    ├── models/
    │   └── health/
    │       └── HealthViewModel.ts    # VM types: formatted strings, flags
    ├── screens/
    │   └── health/
    │       ├── HealthScreen.tsx      # humble view: renders VM, delegates to presenter
    │       ├── HealthPresenter.ts    # forms, busy flags, graduation flow, dispatches via CQBus
    │       └── components/           # HabitRow, CountersSection, GoalsSection (pure, VM-driven)
    ├── components/                   # app chrome: shell, chat, auth, primitives
    ├── modals/
    └── lib/                          # format, theme, navigation helpers (React-free where possible)
```

Tests (mirroring the backend convention):

```text
core/app/health/__tests__/GetHabitsOverview.test.ts        # fake HealthGateway
core/app/health/__tests__/GraduateGoal.test.ts
core/domain/health/__tests__/Goal.test.ts
core/infrastructure/http/__tests__/FetchHttpClient.test.ts # against a local test server
core/infrastructure/http/__tests__/HttpHealthGateway.test.ts
ui/screens/health/__tests__/HealthPresenter.test.ts        # vitest, no React, fake CQBus/gateways
```

Design rules:

- **`core/` never imports React.** Enforced by an eslint `no-restricted-imports` rule per directory.
- **Views never dispatch commands or hold logic.** They read `presenter.model` and call presenter methods. Conditionals in JSX limited to rendering VM flags.
- **Presenters never touch HTTP or storage directly** — they dispatch CQBus requests and subscribe to observables/events.
- **`@vdp/shared` stays the wire contract.** `core/domain` models wrap DTOs only when behavior earns it (same dual-style rule as the backend: rich `Goal`, plain types for pure data). No duplicated response shapes.
- **Invalidation becomes explicit:** command handlers (or presenters) emit `ui/events` observables (`habitsChanged`…); presenters subscribed to them re-query. This replaces React Query's `invalidateQueries`.
- **StrictMode rule:** presenters must tolerate `start/stop/start` (idempotent subscriptions, cleanup in `stop`).

What CQBus buys in the web (and what it doesn't): a uniform middleware pipeline (logging, error normalization → typed UI errors, future telemetry), request objects as the single vocabulary shared with skills and the API, and decoupling presenters from handler wiring. `Identity`/`ExecutionContext` will be mostly unused client-side (the session cookie is implicit) — that's fine; it costs nothing.

## 5. Next.js fit — the critical trade-off

### Option A — stay on Next as a pure shell

Keep App Router for routes/layouts, everything client components, presenters + Core in the client, Fastify as the only backend.

- Pros: zero migration cost now; keeps the cookie BFF, middleware redirect, PWA metadata, Vercel deploys.
- Cons (these are permanent, not one-off):
  - **Client components still prerender on the server.** A module-level `Core` (SSE streams, observables, `window`) must be lazily/conditionally initialized to survive SSR of client components. The composition root — the heart of the pattern — needs `typeof window` guards forever.
  - The `usePresenter` `require()` issue hits webpack at build time; needs config workarounds (or vendoring).
  - Permanent RSC mental tax (`"use client"` discipline, hydration warnings, server/client boundary) for features that use none of it.
  - Two test runtimes philosophically: vitest for logic, Next-specific quirks for anything touching the router.
  - We keep paying a full framework (build times, upgrade cycles, Vercel coupling) for a router + proxy.

### Option B — Vite SPA, Fastify as the single backend

React + Vite + react-router as a pure SPA. The SPA is served same-origin with the API (see below), so the **entire BFF layer is deleted**: the api sets/reads the `vdp_session` httpOnly cookie directly, `request()` calls `/api/v1/...` relative.

- Pros:
  - The pattern fits natively: `Core` is a plain singleton built in `WebApp.tsx`; no SSR, no hydration, no `"use client"`, no guards.
  - Deletes code: proxy route, 9 Next auth routes (cookie handling moves into the existing Fastify auth module), `lib/server/backend.ts`, middleware (the existing `AuthGate` already handles client-side redirect).
  - One test stack (vitest everywhere), one mental model, fast HMR.
  - `usePresenter`'s `require()` is harmless under Vite (runtime catch); vendoring remains optional.
- Cons / costs:
  - Port session: routing tree (App Router → react-router), 23 files of Next imports (18 are `Link`), login flow, PWA manifest + theme script (static `index.html` — trivial), Playwright base URL.
  - Auth cookie endpoints must move into the Fastify auth module (it already manages sessions and accepts `x-session-token`; this is additive).
  - Deployment changes (owner decision, §8): either Fastify serves the SPA's static build (one Render service, same-origin for free) or the SPA is hosted static with a platform rewrite proxying `/api` (also same-origin). Vercel becomes unnecessary.
  - The decorative landing becomes a static route in the SPA (or a plain static page). No SEO loss that matters (owner-confirmed).

### Option C — hybrid (Next marketing shell + Vite app)

Keep a minimal Next (or plain static) site for the landing and mount the SPA elsewhere. Rejected: it preserves two frameworks and two deploys to protect a page the owner calls decorative. The landing can live as a static route inside the SPA at near-zero cost.

### Evaluation summary

| Criterion | A (Next shell) | B (Vite SPA) |
|---|---|---|
| Friction with presenter/Core pattern | Medium-high, permanent (SSR of client components, build quirks) | None |
| Incidental complexity | RSC boundary + BFF + 2 runtimes | Router swap once, then minimal |
| DX | Slower builds, framework churn | Fast HMR, vitest-aligned |
| SSR/SEO needs of VDP | Unused (app behind login; landing decorative) | N/A — not needed |
| Migration cost | 0 now | ~1 focused session (23 coupled files, thin pages) |
| Deployment | Vercel + Render | Single Render service (or static + rewrite) |
| Risk | Low now, compounding friction later | Bounded one-time port, validated by existing Playwright e2e |

### Recommendation

**Option B — Vite SPA, served same-origin with the Fastify api.** The audit shows Next is already used as a shell; the only real Next features in use (cookie BFF, auth routes, middleware) exist to work around *not* being same-origin with the api — and the SPA move dissolves that problem instead of maintaining it. VDP needs no SSR/SEO (single-owner app behind login; landing decorative). The one-time port is small and measurable (23 files of Next coupling, layout-only pages, an existing e2e suite to validate), while Option A's friction is permanent and lands exactly on the composition root, the piece this architecture lives on.

Sequencing (anti-big-bang): port **first**, migrate to presenters **after**. Rationale: the port is mechanical (features keep their current hook pattern during the port), and doing it first means the presenter pilot is built once, on the final platform, instead of being built under Next's constraints and rebuilt later. The reverse order would force solving SSR-guards + webpack workarounds for code we plan to delete.

## 6. React Query removal (owner-decided direction)

RQ's responsibilities get explicit homes:

- **Fetching/orchestration** → CQBus commands/queries in `core/app`.
- **Busy/error state** → presenter ViewModel flags (per action, e.g. `isGoalBusy(goalId)` becomes VM state the presenter maintains).
- **Invalidation** → `ui/events` observables emitted after commands; presenters re-query on subscription. Cross-domain refreshes (e.g. relapse → insights) become explicit event subscriptions instead of magic key invalidation.
- **Caching** → deliberately dropped. Screens re-fetch on mount; at VDP's scale (single user, small payloads) RQ's cache solves a problem we don't have. If a hot path ever needs it, an in-memory store in `core/infrastructure` is the place — like the backend's insight stores.
- **SSE insights / chat streaming** → `ObservableResource` + streams in `core/infrastructure/sse`, consumed via `useObservableValue`/`useObservableResource`. The pilot must include one of these flows (see §7) so the architecture isn't validated on CRUD alone.

## 7. Pilot plan

**Pilot feature: `health`** (owner's suggestion; right size: 14 use cases, 3 entities, one screen, a real flow — graduation — and a cross-domain signal).

Prerequisite session — **the Vite port** (no pattern change):

1. Scaffold Vite + react-router inside `apps/web` (or `apps/webapp` then rename), port routes 1:1 from the App Router tree, swap `next/link`/`next/navigation` imports (23 files), static `index.html` with PWA manifest + theme script.
2. Move cookie handling into the Fastify auth module; delete the proxy + Next auth routes; `request()` base becomes `/api/v1`.
3. Serve same-origin (dev: Vite proxy to `:3001`; prod per owner decision §8).
4. Done when: Playwright e2e green, manual smoke (login, tasks, wallet, health, chat, insights) passes, Next dependencies removed.

Pilot sessions — **health on the full architecture**, coexisting with the other features still on hooks+RQ:

1. Foundations: `core/Core.ts` (CQBus + middlewares + gateway wiring), `FetchHttpClient` + test, `react-presenter` adopted as published (RC; Vite tolerates its optional `require` at runtime), `ui/events` observables.
2. `core/domain/health` (Goal/Counter/Habit models absorbing today's selectors) + `HealthGateway` port + `HttpHealthGateway` + tests.
3. `core/app/health` — the 14 command/query handlers + unit tests with a fake gateway.
4. `ui/screens/health` — `HealthPresenter` + VM + humble components; presenter unit tests cover: form lifecycles, busy flags per entity, the graduation offer flow, error states.
5. Integration: SSE insights consumption on the health screen path (the stateful flow requirement), StrictMode double-mount verified.

**Pilot "done" criteria:**

- `features/health/` deleted; health runs only on the new structure.
- Test pyramid in place: presenter tests (no React), app service tests (fake gateway), `FetchHttpClient`/gateway tests, existing Playwright health e2e green.
- No React import anywhere under `core/` (lint-enforced).
- RQ no longer imported by any health code.
- A short `docs/architecture/frontend-module-template.md` extracted from the pilot — the input for the Arista 2 skills.
- Owner smoke in the browser.

## 8. Migration plan (module by module)

Order (smallest risk → largest, leaving the most stateful for last, one module per session):

1. **health** — pilot (above).
2. **review** (~1.2k lines) — smallest real feature; validates the template on a second module.
3. **home** (~1.6k lines) — includes the insights surface; consolidates the SSE/observable pattern.
4. **tasks** (~5k lines) — the reference module; includes chat-sync coupling with the shell.
5. **wallet** (~6.3k lines) — largest; by now the template is proven.
6. **shell + chat + auth components** (~2.6k lines) — chat streaming presenter, insights provider, auth gate; last because they are cross-domain and the most stateful.

Coexistence rules during migration:

- Old (`features/{domain}` + RQ) and new (`core/` + `ui/screens/{domain}`) live side by side; the router decides which implementation a route uses. RQ's provider stays mounted until the last consumer dies.
- A migrated module must not import from `features/`; legacy features may not import from `core/` (one-way ratchet, lint-enforced).
- Each session ships one module complete (code + tests + smoke + delete the legacy folder) — same per-feature gate discipline as AGENTS.md.
- `@vdp/shared` contracts don't change during migration; this is a frontend-internal reshape.

After migration: Arista 2 skills are written from the proven template; Arista 3 (CQBus on the api) proceeds independently — it does not block any of the above.

## 9. Decisions — CONFIRMED by the owner (June 2026)

| # | Decision | Resolution |
|---|---|---|
| 1 | Platform | **Vite SPA** (Option B, §5) |
| 2 | Sequencing | **Port to Vite first**, presenter pilot after |
| 3 | Prod serving | **Fastify serves the SPA static build** — single Render service; Vercel retired |
| 4 | `usePresenter` packaging | **Use `react-presenter` as published (1.0.0-rc), no changes** — under Vite the optional react-navigation `require()` fails harmlessly at runtime (owner reversal, June 2026: no web-clean 1.0 publish needed since Next/webpack is out of the picture). Vendoring stays as fallback if issues appear |
| 5 | HTTP client | **Write `FetchHttpClient`** over `abstract-http-client`; never adopt `axios-http-client` as-is (CVE-bearing axios 0.27) |
| 6 | `cqbus` version | **Use 0.5.4 as-is**; a 1.0 can come later without code changes |
| 7 | React Query | **Remove** per migration plan (§6) |
| 8 | Landing page | **Static route inside the SPA** (decorative, owner-confirmed) |

## 10. Arista 2 — Claude Code skills (structure proposal)

Scope agreed for this session: (a) repo convention for hosting skills, (b) a skeleton of what each skill should contain based on the Arista 1 architecture, (c) the questions the owner must answer before the skills are written. The skills themselves are NOT written in this session.

### 10.1 Repo convention

Project-level Claude Code skills live in `.claude/skills/{skill-name}/SKILL.md` (the standard location; they become available as `/{skill-name}` in any session on this repo and are committed, so every agent session gets them).

```text
.claude/skills/
├── code-review/
│   └── SKILL.md
├── create-service-api/
│   ├── SKILL.md
│   └── templates/            # file templates with placeholders, when useful
├── create-service-web/
│   └── SKILL.md
├── create-presenter-web/
│   └── SKILL.md
├── create-aggregate/
│   └── SKILL.md
├── create-agent-tool/
│   └── SKILL.md
└── tdd-workflow/
    └── SKILL.md
```

Conventions:

- `SKILL.md` frontmatter: `name` + `description` (the description is what triggers/justifies invocation — written so the skill fires on the right requests and not otherwise).
- **Single source of truth rule:** skills do not duplicate architecture rules; they reference `AGENTS.md` and `docs/architecture/` (notably the `frontend-module-template.md` that the pilot will produce). A skill contains *procedure* (steps, file list, checklists, verification commands); rules live in the docs. This keeps skills from drifting when the architecture evolves.
- Each generator skill ends with a verification section: the exact targeted commands to run (typecheck + the narrowest test suite), per the AGENTS.md verification ladder.
- Skills are written in English (consistent with code/docs).

### 10.2 Skeleton per skill

Common shape for the four generator skills: **Inputs** (what to ask the user if missing) → **Files to create/touch** (exhaustive list) → **Hard rules** (links) → **Steps** → **Self-check list** → **Verification commands**.

1. **`code-review`** — review the current diff (or a named module), organized in three sections (owner direction; one section pending confirmation, see §10.3).
   - **Severity model (owner-decided):** a single level — *warning*. Any warning means: do NOT commit/push; report the findings to the owner and wait. Principles are orientation, not dogma — the skill must instruct judgment ("ser criterioso"), explicitly allowing "this technically violates X but is fine here because Y".
   - **Section: Design.** Example checks: SOLID compliance, DRY (distinguishing incidental duplication), Law of Demeter, Tell-Don't-Ask, YAGNI, anemic domain model, CQS, hexagonal/ports-and-adapters boundaries, modular monolith boundaries. The skill distills each reference into one-line review questions; links stay as citations, not required reading per review.
     - Reference reading (owner-provided): [SOLID/CUPID/GRASP](https://www.boldare.com/blog/solid-cupid-grasp-principles-object-oriented-design/), [Law of Demeter](https://es.wikipedia.org/wiki/Ley_de_Demeter), [ETC principle](https://medium.com/@zayminmaw/e-t-c-the-forgotten-principle-321d827268ec), [YAGNI](https://martinfowler.com/bliki/Yagni.html), [DRY & incidental duplication](https://anthonysciamanna.com/2018/07/28/the-dry-principle-and-incidental-duplication.html), [Tell Don't Ask](https://martinfowler.com/bliki/TellDontAsk.html), [Beck design rules](https://martinfowler.com/bliki/BeckDesignRules.html), [CQS](https://martinfowler.com/bliki/CommandQuerySeparation.html), [Command pattern](https://refactoring.guru/design-patterns/command), [Anemic Domain Model](https://www.martinfowler.com/bliki/AnemicDomainModel.html), Kamil Grzybek's modular monolith series ([primer](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer), [integration styles](https://www.kamilgrzybek.com/blog/posts/modular-monolith-integration-styles), [domain-centric design](https://www.kamilgrzybek.com/blog/posts/modular-monolith-domain-centric-design), [architecture enforcement](https://www.kamilgrzybek.com/blog/posts/modular-monolith-architecture-enforcement)), hexagonal architecture ([Cockburn](https://alistair.cockburn.us/hexagonal-architecture), [OCTO](https://blog.octo.com/en/hexagonal-architecture-three-principles-and-an-implementation-example)), Vaadin DDD series ([strategic](https://vaadin.com/blog/ddd-part-1-strategic-domain-driven-design), [tactical](https://vaadin.com/blog/ddd-part-2-tactical-domain-driven-design), [DDD + hexagonal](https://vaadin.com/blog/ddd-part-3-domain-driven-design-and-the-hexagonal-architecture)), Ian Cooper ([catalogue metaphor & CQS](https://web.archive.org/web/20170716214611/http:/codebetter.com/iancooper/2009/10/08/the-catalogue-metaphor-and-command-query-seperation-architectures/), [why CRUD may not be what they need](https://web.archive.org/web/20200217152108/http:/codebetter.com/iancooper/2011/07/15/why-crud-might-be-what-they-want-but-may-not-be-what-they-need/)).
     - Suggested additions (mine): [Presentation Domain Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html) (the layering this whole architecture implements), [Connascence](https://connascence.io/) (a finer-grained coupling vocabulary than "high/low"), [code smells catalog](https://refactoring.guru/refactoring/smells), and Qiu's [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) (§3 of this doc).
   - **Section: repo rules.** AGENTS.md auth-context rules, currency rule (never sum across currencies), date conventions, entity snapshot immutability, test placement (fakes in `__tests__/fakes/`), the three synchronized DB changes; post-pilot also: no React imports under `core/`, humble views (no logic in JSX beyond VM flags), presenter StrictMode idempotency, one-way migration ratchet. *(Proposed as one of the three sections — pending owner confirmation.)*
   - **Section: tests.** Coverage of the change at the right pyramid level, test quality (FIRST, one behavior per test, readable Given-When-Then), fakes vs real DB placement. Shares the reference list with `tdd-workflow`. *(Proposed as one of the three sections — pending owner confirmation.)*
   - Output: findings grouped by section, each with file:line, the principle/rule involved, and the judgment call ("warning" or "noted, acceptable because…").

2. **`create-service-api`** — scaffold one backend use case in an existing module.
   - Files: `server/src/modules/{domain}/services/{UseCase}.ts`, registration in `{Domain}ModuleRuntime.registerServices()`, route in the controller, Zod schema + types in `@vdp/shared`, unit test with fake repos, e2e case when the route is new.
   - Hard rules: one class per use case; depends on repository interfaces, never Drizzle tables; `userId` from auth context, never from input; lazy-signal pattern reference for time-based behavior.
   - Note: when Arista 3 lands, this skill switches from "service class + ServiceProvider" to "CQBus request + handler" — the skill is versioned with the architecture, not frozen.

3. **`create-service-web`** — scaffold one frontend application use case.
   - Files: `core/app/{module}/{UseCase}.ts` (Command/Query + handler), method on the `{Module}Gateway` port, implementation in `Http{Module}Gateway`, fake gateway update, registration in `Core.ts`, unit test with the fake gateway, `ui/events` emission when the command invalidates state.
   - Mirrors the API skill so both sides keep the 1:1 use-case correspondence visible in §4.

4. **`create-presenter-web`** — scaffold a presenter + humble view pair.
   - Files: `ui/screens/{module}/{Name}Presenter.ts`, VM types in `ui/models/{module}/`, screen/component shells, presenter unit test.
   - Hard rules baked in: presenter never touches HTTP/storage (dispatches CQBus, subscribes observables); `start/stop` idempotent (StrictMode); VM carries formatted strings (`.font-data` metrics formatting happens here, not in JSX); view renders VM and delegates — zero logic.
   - Test template: fake bus + fake events, cover init/start/stop, one happy action, one busy-flag transition, one error state.

5. **`create-aggregate`** — scaffold a backend domain entity (rich style), plus a lighter web variant (owner-decided).
   - Backend files: `domain/{Entity}.ts` (immutable, `fromSnapshot()`/`toSnapshot()`), `domain/{Entity}Repository.ts`, `infrastructure/db/Drizzle{Entity}Repository.ts`, schema addition + `bindings.ts`, fake repository, entity unit test, and the **three synchronized DB changes** checklist (Drizzle schema + `pnpm db:generate`, `SETUP_SQL`, `truncate()` list) — the known failure mode it must prevent.
   - Web variant (lighter): `core/domain/{module}/{Entity}.ts` model + unit test, gateway port touch-points; no persistence concerns. Written after the pilot, same timing as `create-service-web`.
   - Includes the dual-style rule: confirm rich entity is warranted (state transitions/invariants); otherwise recommend plain types + service logic and stop.

6. **`create-agent-tool`** — scaffold one agent tool for an existing module (owner-decided: separate skill, not bundled into `create-service-api`; to be written from the existing agent code as the template).
   - Files: tool factory in `{domain}/infrastructure/agent/tools.ts`, tool name added to the typed registry in `packages/shared/src/constants/agent-tools.ts` FIRST (both sides typecheck against it), system-prompt rule updates when the tool changes agent behavior, tests.
   - Hard rules baked in (from AGENTS.md production lessons): factories close over `ServiceProvider` + `AuthContextStorage`; `userId` derived inside execution from auth context, never from LLM input; LLM-provided dates validated with `localDateStringSchema`; system prompts must be builder functions, never module-level consts; cross-user isolation test required.

7. **`tdd-workflow`** — process skill (no scaffolding): the red-green-refactor loop applied to this codebase's layer order.
   - **Owner-decided scope:** test-first always *in principle*, applying judgment — but only for non-integration/non-e2e tests (unit/social tests drive design; integration and e2e suites are written as verification, not necessarily first). Bugfixes are in scope: regression test first, then the fix.
   - Defines: which test to write first per change type (domain → service → presenter), when fakes vs real DB, the targeted-before-broad verification ladder, and the stop conditions ("do not write the next layer until the current one is green").
   - The skill distills the references into operating rules (test shape, naming, one-behavior-per-test, when to mock vs fake) rather than linking them as required reading.
     - Reference reading (owner-provided): [practical test pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), [test desiderata](https://medium.com/@kentbeck_7670/test-desiderata-94150638a4b3), [programmer test principles](https://medium.com/@kentbeck_7670/programmer-test-principles-d01c064d7934), [ten I-statements about TDD](https://www.geepawhill.org/2021/08/03/ten-i-statements-about-tdd/), [TDD guided by ZOMBIES](https://blog.wingman-sw.com/tdd-guided-by-zombies), [London vs Detroit TDD](https://blog.ncrunch.net/post/london-tdd-vs-detroit-tdd.aspx), [Mock Roles, not Objects (jMock OOPSLA)](https://jmock.org/oopsla2004.pdf), [test contravariance](https://blog.cleancoder.com/uncle-bob/2017/10/03/TestContravariance.html), [test definitions](https://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.html), [10 classic TDD mistakes](https://www.linkedin.com/pulse/10-classic-tdd-mistakes-jason-gorman/), [FIRST](http://jmbarroso.es/2012/01/en-testing-lo-primero-es-f-i-r-s-t/), [readable tests with AssertJ](https://adictosaltrabajo.com/2016/03/16/tests-mas-legibles-con-assertj/), [naming test classes and methods](https://www.codurance.com/publications/2014/12/13/naming-test-classes-and-methods), [Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html), [parameterized tests](https://www.baeldung.com/parameterized-tests-junit-5), [introducing BDD](https://dannorth.net/blog/introducing-bdd/), [IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html), [Humble Object](http://xunitpatterns.com/Humble%20Object.html), [MVP guidelines](https://medium.com/@cervonefrancesco/model-view-presenter-android-guidelines-94970b430ddf), [characterization testing](https://michaelfeathers.silvrback.com/characterization-testing), [e2e testing with node](https://marmelab.com/blog/2016/04/19/e2e-testing-with-node-and-es6.html), load testing ([load vs stress](https://www.loadview-testing.com/learn/load-testing-vs-stress-testing/), [Artillery intro](https://www.testim.io/blog/artillery-load-testing-introduction-see-how-your-code-scales/), [Artillery core concepts](https://www.artillery.io/docs/get-started/core-concepts)).
     - Suggested addition (mine): [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) (the classical-vs-mockist distinction underlying the London/Detroit split, directly relevant to the fakes-over-mocks convention this repo already follows).

### 10.3 Owner resolutions (June 2026)

1. **Invocation model — CONFIRMED:** auto-trigger for `code-review` and `tdd-workflow` (process guards), manual for the generator skills.
2. **`code-review` — CONFIRMED:** single severity level, *warning*: any finding blocks commit/push and is reported to the owner. Principles as orientation, not dogma. Three sections: **Design** (owner-specified, reference list in §10.2), **repo rules**, and **tests** (proposed and owner-confirmed).
3. **Agent tools — CONFIRMED:** a separate `create-agent-tool` skill, written from the existing agent code as template; not bundled into `create-service-api`.
4. **`create-aggregate` web variant — CONFIRMED:** yes, a lighter web variant; written after the first end-to-end (pilot), same timing as `create-service-web`.
5. **`tdd-workflow` — CONFIRMED:** test-first always in principle (with judgment); applies only to non-integration/non-e2e tests; applies to bugfixes via regression-test-first. Reference list in §10.2.
6. **Timing — CONFIRMED:** `create-presenter-web`/`create-service-web` (and the web aggregate variant) after the pilot; `code-review`, `create-service-api`, `create-aggregate` (backend), `create-agent-tool`, `tdd-workflow` can be written before, since they encode rules already in force.

## 11. Arista 3 — CQBus on the api (preliminary analysis)

Scope agreed: preliminary analysis only — what exists, what changes, planted as a roadmap phase. Implementation details get their own session.

### 11.1 What exists today (the pieces CQBus touches)

- **`ServiceProvider`** (`common/base/services/`) — a lazy, constructor-keyed service locator. Module runtimes register factories; controllers and agent tools dispatch with `this.services.get(UseCase).execute(userId, args)`. **83 service files** across auth/tasks/wallet/health, **144 `services.get()` call sites**. No middleware pipeline: no uniform logging, tracing, or auditing around use-case execution.
- **Identity flow** — `AuthContextStorage` (AsyncLocalStorage) is the source of truth. But HTTP controllers read `request.auth.userId!` and pass `userId` as an explicit first argument into every service; only agent tools read the storage directly. The "never trust caller-supplied userId" rule is enforced by convention and review, not by structure.
- **`EventBus`** — pub/sub for domain events (cross-domain signals). Orthogonal to CQBus (request/response): **it stays**. CQBus complements it, never replaces it.
- **Observability** — `TraceService`/`LLMTraceService` (OTel/Langfuse) are wired for agents; plain HTTP use cases have no uniform span/log treatment.
- **Controllers** — thin Zod-validating adapters (`defineRoute`) over services. Already the shape CQBus wants; only the dispatch line changes.

### 11.2 What changes

1. **Services become Command/Query + Handler pairs.** `CreateGoal.execute(userId, input)` becomes `CreateGoal extends Command<GoalRow>` (carrying the input) + `CreateGoalHandler implements RequestHandler<CreateGoal, GoalRow>` (same body, same dependencies). Unit tests keep constructing handlers directly with fakes — the test suites survive nearly unchanged.
2. **`ModuleContext` gains `cqBus`;** module runtimes register handlers (`bus.registerHandler(CreateGoal, () => new CreateGoalHandler(goalRepo, eventBus))`) instead of `services.register(...)`. `ServiceProvider` retires when its last consumer dies.
3. **Identity becomes structural.** A per-request middleware builds `ExecutionContext` with a `VdpIdentity` mapped from `AuthContextStorage`. Handlers read identity from the context — controllers stop passing `userId` by hand at 144 call sites. This converts the repo's most safety-critical convention (auth-context rules in AGENTS.md) from "reviewed" to "structural": a handler *cannot* receive a caller-supplied userId because the signature no longer has one. Agent tools dispatch through the same bus with the same context built from `authContextStorage.getAuthContext()`.
4. **Middlewares carry the cross-cutting concerns:** request logging with duration, OTel span per command/query (reusing `TraceService`), error normalization, and — notably — the **`RequestAuditLogger`** left pending as a product decision in the June 2026 backend review: a CQBus middleware is exactly where it belongs, one class auditing every use case uniformly instead of per-service instrumentation.
5. **Symmetry with the web.** Both sides share the request/handler vocabulary; `create-service-api` and `create-service-web` (Arista 2) generate mirror shapes, and the 1:1 use-case correspondence of §4 becomes literal.

### 11.3 What does NOT change

`EventBus` and all domain events; repositories and Drizzle adapters; the Zod validation layer and controller routing; `AuthContextStorage` itself (it remains the source feeding `Identity`); the agent architecture (`BaseAgent`, registry, chat handler); the module pattern (`{Domain}Module` + runtime).

### 11.4 Honest cost/benefit

- **Benefit:** uniform middleware pipeline (logging/OTel/audit in one place), structural enforcement of the auth rule, and one canonical use-case shape across api + web + skills. 
- **Cost:** mechanical churn across ~83 service files and 144 call sites — rename-shaped, low-risk, highly suited to one-module-per-session conversion with the existing test suites as the net.
- **Risk:** low. `cqbus` 0.5.4 is dormant but tiny and dependency-free; its generic `Identity` maps cleanly from `AuthContext`. The middleware pipeline is the only genuinely new behavior.
- **Verdict:** worth doing, but **after** the frontend pilot proves the pattern and vocabulary — the api is production-stable and gains nothing from going first; the web pilot informs the final handler ergonomics the skills will encode.

### 11.5 Conversion plan (when its turn comes)

1. Introduce `CQBus` in `Core` alongside `ServiceProvider` (coexistence, no flag-day). Wire the identity middleware first — it is the piece with real safety value.
2. Convert **health** first (16 service files, the freshest module): services → handlers, controller dispatches via bus, agent tools via bus. One session.
3. Add logging/OTel middlewares; decide `RequestAuditLogger` (owner product decision, separate).
4. Convert auth → tasks → wallet, one session each; delete `ServiceProvider`.
5. Update `create-service-api` skill to its final CQBus form (per §10.2 note).

## 12. Roadmap insertion (to be reflected in ROADMAP.md)

Phase 4 (Health deepening) pauses after H2. The architecture track runs:

- **A1.** Vite SPA port (one session; no pattern change). Owner in parallel: publish `react-presenter` 1.0.
- **A2.** Health pilot on presenters + CQBus + Core (§7; ~2–3 sessions).
- **A3.** Skills wave 1 — `code-review`, `tdd-workflow`, `create-service-api` (pre-CQBus form), `create-aggregate` (backend), `create-agent-tool`. Can start before/parallel to A2 (they encode rules already in force).
- **A4.** Skills wave 2 — `create-service-web`, `create-presenter-web`, aggregate web variant (template from the pilot).
- **A5.** Frontend migration by module: review → home → tasks → wallet → shell/chat (one session each, §8).
- **A6.** CQBus on the api (§11.5), then `create-service-api` final form.
- Resume Phase 4: P1 → H3v0 → P2 → P3.
