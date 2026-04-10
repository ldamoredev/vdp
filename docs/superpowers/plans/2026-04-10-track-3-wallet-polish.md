# Track 3 — Wallet Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Wallet feel visually and behaviorally coherent with Tasks so moving between `/tasks` and `/wallet` no longer feels like switching to a rougher module.

**Architecture:** Keep the existing Wallet presentation module, but add a thin set of wallet-specific presentation primitives that mirror the density and hierarchy already proven in Tasks. Consolidate row treatment, section headers, empty states, and tone/copy into shared wallet components so the polish pass is systematic instead of screen-by-screen CSS drift.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, TanStack Query 5, Vitest 3, Tailwind v4, `renderToStaticMarkup` tests for presentational coverage.

---

## Spec Reference

This plan implements **Track 3 — Wallet Polish** from `docs/superpowers/specs/2026-04-08-product-clarity-and-real-value-design.md`.

Done signal from the spec:

> Switching from `/tasks` to `/wallet` does not feel like a step down. A stranger could not tell which module shipped first.

## Out of Scope

- New Wallet backend endpoints or schema changes.
- Track 4 review ritual work.
- New animation systems or a new design system.
- Reworking Tasks visuals just to match Wallet.
- Category CRUD, forecasting, or any intelligence feature outside presentation polish.

## File Structure

**New files**

- `apps/web/src/features/wallet/presentation/components/wallet-operational-header.tsx`
  Purpose: bring the Wallet dashboard hero/header to the same visual density as Tasks’ `OperationalHeader`.
- `apps/web/src/features/wallet/presentation/components/wallet-transaction-row.tsx`
  Purpose: unify row treatment across dashboard recent transactions and the full transactions table/list.
- `apps/web/src/features/wallet/presentation/components/wallet-empty-state.tsx`
  Purpose: centralize Wallet empty-state tone, CTA treatment, and icon layout.
- `apps/web/src/features/wallet/presentation/wallet-polish-selectors.ts`
  Purpose: pure helpers for screen subtitles, badge copy, and compact summary text.
- `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-selectors.test.ts`
  Purpose: unit coverage for copy and summary helpers.
- `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts`
  Purpose: server-render coverage for header, row, and empty-state output.

**Modified files**

- `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx`
- `apps/web/src/features/wallet/presentation/components/recent-transactions.tsx`
- `apps/web/src/features/wallet/presentation/components/transactions-screen.tsx`
- `apps/web/src/features/wallet/presentation/components/stats-screen.tsx`
- `apps/web/src/features/wallet/presentation/components/accounts-screen.tsx`
- `apps/web/src/features/wallet/presentation/components/categories-screen.tsx`
- `apps/web/src/features/wallet/presentation/components/savings-screen.tsx`
- `apps/web/src/features/wallet/presentation/components/investments-screen.tsx`
- `apps/web/src/features/wallet/presentation/components/transaction-form-screen.tsx`
- `apps/web/src/lib/navigation.ts`
- `apps/web/src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.ts`

This plan keeps polish concerns in presentation files only. No shared primitives are added unless Wallet and Tasks are already demonstrably converging on the same pattern.

---

## Task 1 — Pure Copy And Presentation Selectors

**Files:**
- Create: `apps/web/src/features/wallet/presentation/wallet-polish-selectors.ts`
- Create: `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-selectors.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-selectors.test.ts` with coverage for:

```typescript
import { describe, expect, it } from "vitest";
import {
  buildWalletScreenIntro,
  buildWalletEmptyState,
  buildWalletTransactionMeta,
} from "../wallet-polish-selectors";

describe("buildWalletScreenIntro", () => {
  it("returns a denser dashboard subtitle", () => {
    expect(buildWalletScreenIntro("dashboard")).toBe(
      "Resumen operativo de tus cuentas, movimientos y señales del dia",
    );
  });
});

describe("buildWalletEmptyState", () => {
  it("returns wallet-specific empty-state copy for transactions", () => {
    expect(buildWalletEmptyState("transactions")).toEqual({
      title: "Todavía no hay movimientos",
      body: "Cuando registres ingresos o gastos, los vas a ver ordenados y listos para revisar.",
      ctaLabel: "Registrar movimiento",
      ctaHref: "/wallet/transactions/new",
    });
  });
});

describe("buildWalletTransactionMeta", () => {
  it("formats category and date into a compact review string", () => {
    expect(
      buildWalletTransactionMeta({
        categoryName: "Comida",
        date: "2026-04-10",
      }),
    ).toBe("Comida · 10 abr 2026");
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/wallet-polish-selectors.test.ts`

Expected: FAIL with missing module / missing exports.

- [ ] **Step 3: Write the minimal implementation**

Create `apps/web/src/features/wallet/presentation/wallet-polish-selectors.ts` with:

```typescript
import { formatDate } from "@/lib/format";

export type WalletScreenKey =
  | "dashboard"
  | "transactions"
  | "stats"
  | "accounts"
  | "categories"
  | "savings"
  | "investments";

export function buildWalletScreenIntro(screen: WalletScreenKey): string {
  const intros: Record<WalletScreenKey, string> = {
    dashboard: "Resumen operativo de tus cuentas, movimientos y señales del dia",
    transactions: "Movimientos listos para revisar, corregir y filtrar sin perder contexto",
    stats: "Totales y categorias con el detalle necesario para verificar cada numero",
    accounts: "Cuentas activas, saldo inicial y tipo en una sola vista",
    categories: "Categorias claras para capturar y revisar gastos sin friccion",
    savings: "Objetivos con progreso, contexto y acciones visibles",
    investments: "Posiciones activas con retorno y estado faciles de leer",
  };

  return intros[screen];
}
```

Add the matching empty-state and transaction-meta helpers in the same file.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/wallet-polish-selectors.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/wallet/presentation/wallet-polish-selectors.ts apps/web/src/features/wallet/presentation/__tests__/wallet-polish-selectors.test.ts
git commit -m "feat: add wallet polish selectors"
```

---

## Task 2 — Shared Wallet Surface Components

**Files:**
- Create: `apps/web/src/features/wallet/presentation/components/wallet-operational-header.tsx`
- Create: `apps/web/src/features/wallet/presentation/components/wallet-transaction-row.tsx`
- Create: `apps/web/src/features/wallet/presentation/components/wallet-empty-state.tsx`
- Create: `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts`

- [ ] **Step 1: Write the failing markup tests**

Create `apps/web/src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts`:

```typescript
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { WalletOperationalHeader } from "../components/wallet-operational-header";
import { WalletTransactionRow } from "../components/wallet-transaction-row";
import { WalletEmptyState } from "../components/wallet-empty-state";

beforeEach(() => {
  globalThis.React = React;
});

describe("wallet polish markup", () => {
  it("renders an operational-style dashboard header", () => {
    const markup = renderToStaticMarkup(
      createElement(WalletOperationalHeader, {
        title: "Wallet",
        intro: "Resumen operativo de tus cuentas, movimientos y señales del dia",
      }),
    );

    expect(markup).toContain("Resumen operativo");
    expect(markup).toContain("Wallet");
  });

  it("renders a compact transaction row meta line", () => {
    const markup = renderToStaticMarkup(
      createElement(WalletTransactionRow, {
        transaction: {
          id: "txn-1",
          accountId: "acc-1",
          categoryId: "cat-1",
          categoryName: "Comida",
          type: "expense",
          amount: "1500",
          currency: "ARS",
          description: "Almuerzo",
          date: "2026-04-10",
          tags: [],
          createdAt: "2026-04-10T12:00:00Z",
        },
      }),
    );

    expect(markup).toContain("Almuerzo");
    expect(markup).toContain("Comida");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts`

Expected: FAIL with missing component modules.

- [ ] **Step 3: Build the new components**

Create:

- `wallet-operational-header.tsx` with a Tasks-like hero card:
  - eyebrow pill
  - title
  - intro copy
  - right-aligned action slot
  - compact three-stat rail below
- `wallet-transaction-row.tsx` with:
  - shared icon treatment
  - description line
  - compact meta line using `buildWalletTransactionMeta`
  - consistent amount/badge layout for desktop + mobile
- `wallet-empty-state.tsx` with:
  - icon block
  - title
  - body
  - optional CTA link

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/wallet/presentation/components/wallet-operational-header.tsx apps/web/src/features/wallet/presentation/components/wallet-transaction-row.tsx apps/web/src/features/wallet/presentation/components/wallet-empty-state.tsx apps/web/src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts
git commit -m "feat: add shared wallet polish components"
```

---

## Task 3 — Apply The New Surface To Dashboard, Transactions, And Stats

**Files:**
- Modify: `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/recent-transactions.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/transactions-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/stats-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.ts`

- [ ] **Step 1: Extend the existing dashboard test**

Add assertions to `wallet-dashboard-actions.test.ts` that confirm:

```typescript
expect(markup).toContain("Resumen operativo");
expect(markup).toContain("Transacciones recientes");
expect(markup).toContain("Ver todas");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.ts`

Expected: FAIL because the new polish copy is not rendered yet.

- [ ] **Step 3: Recompose the screens**

Make these changes:

- `dashboard-screen.tsx`
  - replace the ad hoc top block with `WalletOperationalHeader`
  - keep quick-add and stats actions, but present them in the header action slot
  - keep `SanityStrip`, recent transactions, and edit sheet behavior
- `recent-transactions.tsx`
  - render rows through `WalletTransactionRow`
  - use `WalletEmptyState` instead of the current inline empty-state block
- `transactions-screen.tsx`
  - preserve current filter/edit behavior
  - move table/list row body toward the same `WalletTransactionRow` density
  - keep the signed sanity-strip total from Track 2
- `stats-screen.tsx`
  - replace the plain intro copy with `buildWalletScreenIntro("stats")`
  - tighten legend row spacing to match recent-transactions row density

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.ts src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx apps/web/src/features/wallet/presentation/components/recent-transactions.tsx apps/web/src/features/wallet/presentation/components/transactions-screen.tsx apps/web/src/features/wallet/presentation/components/stats-screen.tsx apps/web/src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.ts
git commit -m "feat: apply wallet polish to core surfaces"
```

---

## Task 4 — Copy And Empty-State Pass Across The Remaining Wallet Screens

**Files:**
- Modify: `apps/web/src/features/wallet/presentation/components/accounts-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/categories-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/savings-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/investments-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/transaction-form-screen.tsx`

- [ ] **Step 1: Replace inconsistent inline empty states and intros**

For each screen:

- use `buildWalletScreenIntro("<screen>")` for the top description line
- replace any ad hoc “No hay…” block with `WalletEmptyState`
- normalize CTA labels to imperative Spanish:
  - `"Nueva cuenta"`
  - `"Nueva categoria"`
  - `"Nuevo objetivo"`
  - `"Nueva inversion"`
  - `"Registrar movimiento"`

- [ ] **Step 2: Run the app-wide Wallet tests**

Run:

```bash
pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/wallet-selectors.test.ts src/features/wallet/presentation/__tests__/wallet-polish-selectors.test.ts src/features/wallet/presentation/__tests__/wallet-polish-markup.test.ts src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/wallet/presentation/components/accounts-screen.tsx apps/web/src/features/wallet/presentation/components/categories-screen.tsx apps/web/src/features/wallet/presentation/components/savings-screen.tsx apps/web/src/features/wallet/presentation/components/investments-screen.tsx apps/web/src/features/wallet/presentation/components/transaction-form-screen.tsx
git commit -m "feat: align wallet screen copy and empty states"
```

---

## Task 5 — Chat And Shell Wallet Language Polish

**Files:**
- Modify: `apps/web/src/lib/navigation.ts`
- Modify: `apps/web/src/lib/chat/__tests__/tool-actions.test.ts`

- [ ] **Step 1: Refine Wallet shell strings**

Update the Wallet domain config in `navigation.ts` to match the tighter Tasks tone:

```typescript
chatPlaceholder: "Registra un gasto o revisa un numero...",
chatWelcome: "Hola! Soy tu asistente de Wallet",
chatDescription:
  "Podes registrar movimientos, revisar categorias y verificar totales sin salir del flujo.",
aiDescription:
  "Usa el chat para registrar, revisar y corregir tus movimientos con contexto.",
```

- [ ] **Step 2: Keep tool labels aligned**

Extend `tool-actions.test.ts` so wallet tool outputs still render user-facing summaries with `Wallet` / `Finanzas` wording that matches the shell copy.

- [ ] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @vdp/web test src/lib/chat/__tests__/tool-actions.test.ts src/lib/__tests__/navigation.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/navigation.ts apps/web/src/lib/chat/__tests__/tool-actions.test.ts
git commit -m "feat: polish wallet shell language"
```

---

## Final Verification

- [ ] Run the full web test suite:

```bash
pnpm --filter @vdp/web test
```

Expected: PASS, all suites green.

- [ ] Run the production build:

```bash
pnpm --filter @vdp/web build
```

Expected: PASS, Next.js build completes without type errors.

- [ ] Manual pass:
  - open `/wallet`, `/wallet/transactions`, `/wallet/stats`, `/wallet/accounts`
  - compare header density, row spacing, badge language, and empty-state tone against `/tasks`
  - confirm dashboard recent transactions and transactions list still open the edit sheet
  - confirm category drill-down still lands on filtered `/wallet/transactions`

- [ ] Final commit:

```bash
git status --short
git add <remaining polish files>
git commit -m "feat: polish wallet surfaces for tasks parity"
```
