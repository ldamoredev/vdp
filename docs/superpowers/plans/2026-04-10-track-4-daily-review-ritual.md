# Track 4 — Daily Review Ritual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one daily review screen that closes Tasks, verifies Wallet, captures tomorrow decisions, and can be resumed if interrupted.

**Architecture:** Add a dedicated cross-domain `review` presentation feature instead of embedding the ritual inside either Tasks or Wallet. The review model will query existing Tasks and Wallet endpoints, derive review signals with pure selectors, persist in-progress state to `localStorage` keyed by date, and expose a single screen that performs task decisions, transaction review, anomaly acknowledgment, and tomorrow planning without page-jumping.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, TanStack Query 5, Vitest 3, Tailwind v4, existing Tasks and Wallet API clients, `renderToStaticMarkup` for presentational coverage.

---

## Spec Reference

This plan implements **Track 4 — The Daily Review Ritual** from `docs/superpowers/specs/2026-04-08-product-clarity-and-real-value-design.md`.

Done signal from the spec:

> The ritual actually happens most days, in roughly two minutes, and the next morning the product feels prepared instead of stale.

## Implementation Assumptions

- Track 4 starts only after Tracks 1, 2, and 3 are already shipped.
- MVP persistence is local to the browser via `localStorage`, keyed by review date. Server persistence is intentionally deferred until the ritual proves useful.
- Wallet review signals are derived from existing frontend-available data: today’s transactions, today’s summary totals, category totals, and unread insights already surfaced on Home.
- Conversational entry in this repo is implemented as a deep-link CTA from chat tool output. The model/backend deciding when to invoke the review tool remains outside this workspace.

## Out of Scope

- Weekly or monthly reviews.
- New Wallet budgeting tables or backend budget rules.
- Cross-device or server-backed ritual persistence.
- New AI orchestration backends beyond rendering a review CTA in chat.
- Rebuilding Tasks history; Track 4 should reuse existing decisions and mutation flows where possible.

## File Structure

**New files**

- `apps/web/src/features/review/presentation/daily-review-types.ts`
  Purpose: typed state for ritual progress, acknowledgements, watched categories, and note draft.
- `apps/web/src/features/review/presentation/daily-review-selectors.ts`
  Purpose: pure derivations for task signals, wallet anomalies, review progress, and morning summary text.
- `apps/web/src/features/review/presentation/daily-review-storage.ts`
  Purpose: serialize, hydrate, and merge persisted ritual state by date.
- `apps/web/src/features/review/presentation/use-daily-review-model.ts`
  Purpose: cross-domain orchestration hook that wires Tasks queries/mutations, Wallet queries/mutations, insights, edit-transaction state, and persistence.
- `apps/web/src/features/review/presentation/components/daily-review-header.tsx`
  Purpose: progress-aware hero/header for the ritual screen.
- `apps/web/src/features/review/presentation/components/daily-review-task-queue.tsx`
  Purpose: one-click task decisions for done / carry / drop.
- `apps/web/src/features/review/presentation/components/daily-review-wallet-queue.tsx`
  Purpose: today’s wallet review queue with anomaly cards and embedded transaction actions.
- `apps/web/src/features/review/presentation/components/daily-review-insights-queue.tsx`
  Purpose: unresolved assistant flags with acknowledge actions.
- `apps/web/src/features/review/presentation/components/daily-review-decisions.tsx`
  Purpose: tomorrow decisions card with watched categories and review note.
- `apps/web/src/features/review/presentation/components/daily-review-screen.tsx`
  Purpose: compose the ritual into one route-level screen.
- `apps/web/src/features/review/presentation/__tests__/daily-review-selectors.test.ts`
  Purpose: unit coverage for derived signals and progress math.
- `apps/web/src/features/review/presentation/__tests__/daily-review-storage.test.ts`
  Purpose: unit coverage for interrupted-session persistence.
- `apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts`
  Purpose: presentational coverage for the review screen sections.
- `apps/web/src/components/home/daily-ritual-card.tsx`
  Purpose: new home entry card replacing the Tasks-only review card.
- `apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx`
  Purpose: cover home entry states: start, resume, completed.
- `apps/web/src/app/(domain)/review/page.tsx`
  Purpose: dedicated route for the cross-domain ritual.

**Modified files**

- `apps/web/src/app/(domain)/home/page.tsx`
- `apps/web/src/components/chat/message-bubble.tsx`
- `apps/web/src/lib/chat/tool-actions.ts`
- `apps/web/src/lib/chat/__tests__/tool-actions.test.ts`
- `apps/web/src/features/wallet/presentation/edit-transaction/edit-transaction-sheet.tsx`
  Only if the existing sheet needs a prop split so the review screen can open it without depending on the full Wallet page chrome.
- `apps/web/src/features/tasks/presentation/tasks-query-keys.ts`
  Only if a small shared key helper is needed for the new review model; otherwise reuse as-is.

This keeps Track 4 isolated in a new `review` feature while reusing task and wallet mutations that already exist and are already trusted.

---

## Task 1 — Pure Review State, Signals, And Persistence

**Files:**
- Create: `apps/web/src/features/review/presentation/daily-review-types.ts`
- Create: `apps/web/src/features/review/presentation/daily-review-selectors.ts`
- Create: `apps/web/src/features/review/presentation/daily-review-storage.ts`
- Create: `apps/web/src/features/review/presentation/__tests__/daily-review-selectors.test.ts`
- Create: `apps/web/src/features/review/presentation/__tests__/daily-review-storage.test.ts`

- [ ] **Step 1: Write the failing selector and storage tests**

Create `apps/web/src/features/review/presentation/__tests__/daily-review-selectors.test.ts` with coverage for:

```typescript
import { describe, expect, it } from "vitest";
import {
  buildDailyReviewProgress,
  buildWalletReviewSignals,
  buildMorningReviewSummary,
} from "../daily-review-selectors";

describe("buildWalletReviewSignals", () => {
  it("flags uncategorized and unusually concentrated spending for the review queue", () => {
    const result = buildWalletReviewSignals({
      transactions: [
        {
          id: "txn-1",
          accountId: "acc-1",
          categoryId: null,
          categoryName: undefined,
          type: "expense",
          amount: "24000",
          currency: "ARS",
          description: "Compra grande",
          date: "2026-04-10",
          tags: [],
          createdAt: "2026-04-10T10:00:00Z",
        },
      ],
      byCategory: [{ categoryId: "cat-1", categoryName: "Supermercado", total: 24000, count: 1 }],
      acknowledgedSignalIds: [],
    });

    expect(result.visibleSignals.map((signal) => signal.kind)).toEqual([
      "uncategorized",
      "category-spike",
    ]);
  });
});

describe("buildDailyReviewProgress", () => {
  it("treats the ritual as complete only after tasks, wallet, and insights are resolved", () => {
    expect(
      buildDailyReviewProgress({
        pendingTasks: 0,
        unresolvedWalletSignals: 0,
        unresolvedInsights: 0,
        note: "Manana revisar supermercado",
      }),
    ).toMatchObject({
      completed: true,
      label: "Ritual cerrado",
    });
  });
});

describe("buildMorningReviewSummary", () => {
  it("summarizes watched categories and note text for the next morning", () => {
    expect(
      buildMorningReviewSummary({
        watchedCategoryNames: ["Supermercado", "Transporte"],
        note: "No comprar fuera de lista",
      }),
    ).toContain("Supermercado");
  });
});
```

Create `apps/web/src/features/review/presentation/__tests__/daily-review-storage.test.ts` with coverage for:

```typescript
import { describe, expect, it } from "vitest";
import {
  createEmptyDailyReviewState,
  mergePersistedDailyReviewState,
} from "../daily-review-storage";

describe("mergePersistedDailyReviewState", () => {
  it("keeps only the current review date and preserves acknowledged work", () => {
    const base = createEmptyDailyReviewState("2026-04-10");
    const result = mergePersistedDailyReviewState(base, {
      date: "2026-04-10",
      acknowledgedSignalIds: ["wallet:uncategorized"],
      watchedCategoryIds: ["cat-food"],
      note: "Mirar gastos chicos",
    });

    expect(result.acknowledgedSignalIds).toEqual(["wallet:uncategorized"]);
    expect(result.watchedCategoryIds).toEqual(["cat-food"]);
    expect(result.note).toBe("Mirar gastos chicos");
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-selectors.test.ts
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-storage.test.ts
```

Expected: FAIL with missing modules / missing exports.

- [ ] **Step 3: Write the minimal implementation**

Create `daily-review-types.ts` with the persisted state contract:

```typescript
export interface DailyReviewState {
  date: string;
  acknowledgedSignalIds: string[];
  watchedCategoryIds: string[];
  note: string;
  openedAt: string | null;
  completedAt: string | null;
}
```

Create `daily-review-storage.ts` with:

```typescript
const STORAGE_KEY = "daily-review-state";

export function createEmptyDailyReviewState(date: string): DailyReviewState {
  return {
    date,
    acknowledgedSignalIds: [],
    watchedCategoryIds: [],
    note: "",
    openedAt: null,
    completedAt: null,
  };
}
```

Add `loadDailyReviewState`, `saveDailyReviewState`, and `mergePersistedDailyReviewState` in the same file, always discarding stale dates.

Create `daily-review-selectors.ts` with:

- `buildWalletReviewSignals`
- `buildTaskReviewSignals`
- `buildDailyReviewProgress`
- `buildMorningReviewSummary`

Use pure data-only outputs so the model and markup layers stay dumb.

- [ ] **Step 4: Run the tests and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-selectors.test.ts
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-storage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/review/presentation/daily-review-types.ts apps/web/src/features/review/presentation/daily-review-selectors.ts apps/web/src/features/review/presentation/daily-review-storage.ts apps/web/src/features/review/presentation/__tests__/daily-review-selectors.test.ts apps/web/src/features/review/presentation/__tests__/daily-review-storage.test.ts
git commit -m "feat: add daily review selectors and persistence"
```

---

## Task 2 — Review Screen Components And Markup

**Files:**
- Create: `apps/web/src/features/review/presentation/components/daily-review-header.tsx`
- Create: `apps/web/src/features/review/presentation/components/daily-review-task-queue.tsx`
- Create: `apps/web/src/features/review/presentation/components/daily-review-wallet-queue.tsx`
- Create: `apps/web/src/features/review/presentation/components/daily-review-insights-queue.tsx`
- Create: `apps/web/src/features/review/presentation/components/daily-review-decisions.tsx`
- Create: `apps/web/src/features/review/presentation/components/daily-review-screen.tsx`
- Create: `apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts`

- [ ] **Step 1: Write the failing markup tests**

Create `apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts`:

```typescript
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { DailyReviewScreen } from "../components/daily-review-screen";

beforeEach(() => {
  globalThis.React = React;
});

describe("DailyReviewScreen", () => {
  it("renders the three ritual sections and the tomorrow decisions card", () => {
    const markup = renderToStaticMarkup(
      createElement(DailyReviewScreen, {
        dateLabel: "viernes, 10 abr",
        progressLabel: "2 de 4 bloques resueltos",
        taskSection: createElement("div", null, "Cerrar tareas"),
        walletSection: createElement("div", null, "Verificar wallet"),
        insightsSection: createElement("div", null, "Resolver alertas"),
        decisionsSection: createElement("div", null, "Decidir mañana"),
      }),
    );

    expect(markup).toContain("Ritual diario");
    expect(markup).toContain("Cerrar tareas");
    expect(markup).toContain("Verificar wallet");
    expect(markup).toContain("Resolver alertas");
    expect(markup).toContain("Decidir mañana");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts
```

Expected: FAIL with missing component modules.

- [ ] **Step 3: Build the presentational components**

Implement:

- `daily-review-header.tsx`
  - eyebrow: `Ritual diario`
  - title: `Cierra hoy para que mañana arranque liviano`
  - progress pill and date badge
- `daily-review-task-queue.tsx`
  - row-per-task with `Completar`, `Llevar`, `Descartar`
- `daily-review-wallet-queue.tsx`
  - anomaly cards
  - compact transaction list using `WalletTransactionRow`
  - inline edit trigger for suspicious transactions
- `daily-review-insights-queue.tsx`
  - unread insights with `Reconocer` action
- `daily-review-decisions.tsx`
  - watched category chips
  - review note textarea
  - completion summary
- `daily-review-screen.tsx`
  - composes the four sections into one page-ready screen

Keep these components prop-driven and free of queries/mutations.

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/review/presentation/components/daily-review-header.tsx apps/web/src/features/review/presentation/components/daily-review-task-queue.tsx apps/web/src/features/review/presentation/components/daily-review-wallet-queue.tsx apps/web/src/features/review/presentation/components/daily-review-insights-queue.tsx apps/web/src/features/review/presentation/components/daily-review-decisions.tsx apps/web/src/features/review/presentation/components/daily-review-screen.tsx apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts
git commit -m "feat: add daily review screen components"
```

---

## Task 3 — Cross-Domain Review Model And Route

**Files:**
- Create: `apps/web/src/features/review/presentation/use-daily-review-model.ts`
- Create: `apps/web/src/app/(domain)/review/page.tsx`
- Modify: `apps/web/src/features/wallet/presentation/edit-transaction/edit-transaction-sheet.tsx` (only if needed to decouple the sheet from Wallet page-only assumptions)

- [ ] **Step 1: Write the failing route smoke test**

Append a route-level smoke test to `apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts` or add a dedicated `daily-review-route.test.tsx`:

```typescript
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const useDailyReviewModelMock = vi.fn();

vi.mock("../use-daily-review-model", () => ({
  useDailyReviewModel: () => useDailyReviewModelMock(),
}));

import ReviewPage from "@/app/(domain)/review/page";

describe("review page", () => {
  it("renders the ritual screen using the review model", () => {
    useDailyReviewModelMock.mockReturnValue({
      dateLabel: "viernes, 10 abr",
      progressLabel: "1 de 4 bloques resueltos",
      screenProps: {
        dateLabel: "viernes, 10 abr",
        progressLabel: "1 de 4 bloques resueltos",
        taskSection: createElement("div", null, "Cerrar tareas"),
        walletSection: createElement("div", null, "Verificar wallet"),
        insightsSection: createElement("div", null, "Resolver alertas"),
        decisionsSection: createElement("div", null, "Decidir mañana"),
      },
    });

    const markup = renderToStaticMarkup(createElement(ReviewPage));
    expect(markup).toContain("Ritual diario");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts
```

Expected: FAIL until the route/model exist.

- [ ] **Step 3: Implement the orchestration hook**

Create `use-daily-review-model.ts` that:

- reads `today` with `getTodayISO()`
- queries:
  - `tasksApi.getReview(today)`
  - `walletApi.getTransactions({ limit: "50", offset: "0", from: today, to: today })`
  - `walletApi.getStatsSummary({ from: today, to: today })`
  - `walletApi.getStatsByCategory({ from: today, to: today })`
  - `tasksApi.getRecentInsights(10)`
  - `walletApi.getCategories()`
- reuses existing mutations:
  - `tasksApi.completeTask`
  - `tasksApi.carryOverTask`
  - `tasksApi.discardTask`
  - `walletApi.updateTransaction`
- hydrates persisted review state from `daily-review-storage.ts`
- derives:
  - unresolved task queue
  - unresolved wallet signals
  - unresolved unread insights
  - progress badge / completion state
  - morning summary text
- persists state whenever acknowledgements, watched categories, or note text change

Keep this hook responsible for behavior only. All copy and signal thresholds remain in selectors.

- [ ] **Step 4: Add the route**

Create `apps/web/src/app/(domain)/review/page.tsx`:

```typescript
"use client";

import { ModulePage } from "@/components/primitives/module-page";
import { DailyReviewScreen } from "@/features/review/presentation/components/daily-review-screen";
import { useDailyReviewModel } from "@/features/review/presentation/use-daily-review-model";

export default function ReviewPage() {
  const model = useDailyReviewModel();

  return (
    <ModulePage width="6xl" spacing="8">
      <DailyReviewScreen {...model.screenProps} />
    </ModulePage>
  );
}
```

If the review flow needs inline transaction editing, mount `EditTransactionSheet` from this route using model-owned state.

- [ ] **Step 5: Run the test and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/review/presentation/use-daily-review-model.ts apps/web/src/app/(domain)/review/page.tsx apps/web/src/features/review/presentation/__tests__/daily-review-markup.test.ts
git commit -m "feat: add daily review route and model"
```

---

## Task 4 — Home Entry And Chat Entry Point

**Files:**
- Create: `apps/web/src/components/home/daily-ritual-card.tsx`
- Create: `apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx`
- Modify: `apps/web/src/app/(domain)/home/page.tsx`
- Modify: `apps/web/src/lib/chat/tool-actions.ts`
- Modify: `apps/web/src/lib/chat/__tests__/tool-actions.test.ts`
- Modify: `apps/web/src/components/chat/message-bubble.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx`:

```typescript
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { DailyRitualCard } from "../daily-ritual-card";

beforeEach(() => {
  globalThis.React = React;
});

describe("DailyRitualCard", () => {
  it("renders a resume CTA when a review is already in progress", () => {
    const markup = renderToStaticMarkup(
      createElement(DailyRitualCard, {
        statusLabel: "2 de 4 bloques resueltos",
        href: "/review",
        ctaLabel: "Retomar ritual",
      }),
    );

    expect(markup).toContain("Retomar ritual");
    expect(markup).toContain("/review");
  });
});
```

Extend `apps/web/src/lib/chat/__tests__/tool-actions.test.ts` with:

```typescript
it("offers a direct ritual CTA for the day review tool", () => {
  const action = parseToolAction(
    "get_end_of_day_review",
    JSON.stringify({ completed: 3, pending: 2, completionRate: 60 }),
  );

  expect(action).toMatchObject({
    title: "Review del dia",
    ctaLabel: "Abrir ritual diario",
    ctaHref: "/review",
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx
pnpm --filter @vdp/web test -- apps/web/src/lib/chat/__tests__/tool-actions.test.ts
```

Expected: FAIL until the card and CTA fields exist.

- [ ] **Step 3: Implement the home card**

Create `daily-ritual-card.tsx` with:

- title: `Ritual diario`
- status line
- compact summary for tasks + wallet
- CTA label switching between:
  - `Iniciar ritual`
  - `Retomar ritual`
  - `Ver cierre de hoy`

Modify `home/page.tsx` to replace `DayReviewCard` with `DailyRitualCard`, using:

- task review counts
- wallet today transaction count / total
- persisted ritual progress summary from `daily-review-storage.ts`

- [ ] **Step 4: Implement chat CTA rendering**

Extend `ToolActionView` in `apps/web/src/lib/chat/tool-actions.ts`:

```typescript
export interface ToolActionView {
  title: string;
  detail?: string;
  items?: string[];
  tone: ToolTone;
  ctaLabel?: string;
  ctaHref?: string;
}
```

Update `parseToolAction("get_end_of_day_review", ...)` to return:

```typescript
{
  title: "Review del dia",
  detail: "...",
  tone: "info",
  ctaLabel: "Abrir ritual diario",
  ctaHref: "/review",
}
```

Render that CTA in `message-bubble.tsx` as a `Link` under the tool summary card.

- [ ] **Step 5: Run the tests and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test -- apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx
pnpm --filter @vdp/web test -- apps/web/src/lib/chat/__tests__/tool-actions.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/home/daily-ritual-card.tsx apps/web/src/components/home/__tests__/daily-ritual-card.test.tsx apps/web/src/app/(domain)/home/page.tsx apps/web/src/lib/chat/tool-actions.ts apps/web/src/lib/chat/__tests__/tool-actions.test.ts apps/web/src/components/chat/message-bubble.tsx
git commit -m "feat: add daily ritual entry points"
```

---

## Task 5 — Full Verification And Manual Ritual Pass

**Files:**
- No new files required unless a final small test helper is needed.

- [ ] **Step 1: Run the full automated verification**

Run:

```bash
pnpm --filter @vdp/web test
pnpm --filter @vdp/web build
```

Expected: PASS.

- [ ] **Step 2: Manual review in the browser**

Verify:

1. Open `/home` and confirm the ritual card can start or resume today’s review.
2. Open `/review` and resolve one task each way: complete, carry over, discard.
3. Edit one suspicious wallet transaction from the review route and confirm the wallet section updates without leaving the page.
4. Acknowledge one insight, set one watched category, type a note, refresh, and confirm the state resumes.
5. Return to `/home` and confirm the card reflects the new progress / completed state.
6. Trigger the chat day review flow and confirm the tool card exposes `Abrir ritual diario`.

- [ ] **Step 3: Commit final polish if needed**

```bash
git add <final-files>
git commit -m "test: verify daily ritual flow"
```

Only create this commit if manual verification exposes a last-mile bugfix. Otherwise skip it.

---

## Self-Review

**Spec coverage**

- One screen, one flow: covered by `DailyReviewScreen` + `/review`.
- Close the day: covered by task queue actions (`complete`, `carry`, `discard`).
- Notice: covered by wallet anomaly selectors + insights queue.
- Decide tomorrow: covered by watched categories + review note.
- Entry point on Home: covered by `DailyRitualCard`.
- Chat command entry: covered in this repo by tool-action CTA deep-linking to `/review`.
- Persistent state if interrupted: covered by `daily-review-storage.ts`.

**Known constraint**

- The spec’s “same outcomes either way” conversational parity depends partly on the external chat/backend deciding to run the day-review tool and existing mutation tools in sequence. This plan covers the web-side route, state, and tool CTA rendering so the frontend is ready for that behavior.

**Placeholder scan**

- No `TODO` / `TBD` placeholders intentionally left in task steps.
- Every task names concrete files and concrete verification commands.

