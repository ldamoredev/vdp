# Track 2 — Wallet Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every number Wallet shows is obviously correct, or obviously fixable in two clicks. When Wallet reports something, the reaction is "right" or "let me fix that," never "I don't know if I trust this."

**Architecture:** Build three focused capabilities — inline transaction editing, category drill-down from stats, and a view-level sanity strip — all layering onto existing wallet surfaces. Pure logic for edit form state lives in a tested standalone module (same pattern as Track 1's quick-add). The existing `updateTransactionMutation` in `use-wallet-mutations.ts` already supports all needed fields. No backend changes — the `PUT /api/wallet/transactions/:id` and existing stats endpoints already return everything we need.

**Tech Stack:** Next.js 15, React 19, TanStack Query 5, TypeScript 5.7, Vitest 3, Tailwind v4. No DOM testing library — tests target pure functions only.

---

## Spec Reference

This plan implements **Track 2 (Wallet Trust)** from `docs/superpowers/specs/2026-04-08-product-clarity-and-real-value-design.md`. Done signal from the spec:

> When Wallet reports something, the reaction is "right" or "let me fix that," never "I do not know if I trust this."

## Out of Scope (for this plan)

- Complex analytics, projections, forecasting.
- Spending spike detection UI (the insight engine exists server-side but the UI is Track 3/4 territory — this plan makes stats verifiable, not intelligent).
- New backend endpoints or schema changes.
- Receipt scanning, OCR, bank sync.
- Category editing/deleting (create-only exists; full CRUD is Track 3 polish).
- Transfers or income editing via inline edit (inline edit targets expenses/income, not transfers — those stay on the full form).

## File Structure

```
apps/web/src/features/wallet/presentation/
├── edit-transaction/
│   ├── edit-transaction-form-state.ts    ← Task 1: pure validation/transform logic
│   └── edit-transaction-sheet.tsx        ← Task 3: bottom-sheet/modal edit UI
├── sanity-strip/
│   └── sanity-strip.tsx                  ← Task 4: summary strip component
├── __tests__/
│   └── edit-transaction-form-state.test.ts  ← Task 1: unit tests
└── components/
    ├── transactions-screen.tsx           ← Task 3: add row-click → open edit sheet
    └── stats-screen.tsx                  ← Task 2: add category drill-down links
```

Existing files modified:
- `apps/web/src/features/wallet/presentation/components/transactions-screen.tsx` — add edit sheet trigger, sanity strip
- `apps/web/src/features/wallet/presentation/components/stats-screen.tsx` — add category drill-down, sanity strip
- `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx` — add sanity strip to dashboard summary

---

## Task 1 — Edit Transaction Form State (pure logic + tests)

**Files:**
- `apps/web/src/features/wallet/presentation/edit-transaction/edit-transaction-form-state.ts`
- `apps/web/src/features/wallet/presentation/__tests__/edit-transaction-form-state.test.ts`

**What:** Pure functions to hydrate an edit form from a `Transaction`, validate edits, and build the update payload. Same pattern as `quick-add-form-state.ts`.

**Interfaces:**

```typescript
interface EditTransactionFormState {
  amount: string;
  categoryId: string;      // "" means "sin categoría"
  description: string;
  date: string;            // ISO YYYY-MM-DD
  accountId: string;
}

interface EditTransactionFormError {
  field: "amount" | "date" | "accountId";
  message: string;
}
```

**Functions:**

1. `buildEditFormFromTransaction(transaction: Transaction): EditTransactionFormState`
   - Maps transaction fields into form state
   - `categoryId` defaults to `""` if `null`
   - `amount` is the raw string (no formatting)

2. `validateEditTransaction(form: EditTransactionFormState): EditTransactionFormError | null`
   - Empty amount → `"Ingresá un monto"`
   - Non-numeric amount → `"El monto no es un número válido"`
   - Amount ≤ 0 → `"El monto debe ser mayor a cero"`
   - Empty date → `"Ingresá una fecha"`
   - Empty accountId → `"Elegí una cuenta"`
   - Returns `null` if valid

3. `buildUpdatePayload(original: Transaction, form: EditTransactionFormState): Partial<Transaction> | null`
   - Compares form state against original transaction
   - Returns only the changed fields as a partial, or `null` if nothing changed
   - Converts `categoryId: ""` → `null`
   - Trims description, converts empty to `null`

**Tests (≥10 cases):**
- [ ] Hydrates form from a transaction correctly
- [ ] Hydrates form when categoryId is null (maps to "")
- [ ] Validates empty amount
- [ ] Validates non-numeric amount
- [ ] Validates zero/negative amount
- [ ] Validates empty date
- [ ] Validates empty accountId
- [ ] Returns null for valid form
- [ ] buildUpdatePayload returns null when nothing changed
- [ ] buildUpdatePayload returns only changed fields
- [ ] buildUpdatePayload converts empty categoryId to null
- [ ] buildUpdatePayload trims and nullifies empty description

**TDD:** Write all tests RED first, then implement GREEN, then refactor.

---

## Task 2 — Category Drill-Down from Stats

**Files modified:**
- `apps/web/src/features/wallet/presentation/components/stats-screen.tsx`

**What:** Make category legend rows clickable. Clicking a category navigates to `/wallet/transactions?type=expense&categoryId={id}`, filtering the transaction list to show only that category's expenses so the user can verify the total.

**Steps:**
- [ ] Wrap each category legend row in a `<Link>` to `/wallet/transactions?type=expense&categoryId={row.categoryId}`
- [ ] Add hover/cursor pointer styles to indicate interactivity
- [ ] Add a small arrow icon (`ChevronRight` from lucide-react) to the right of each row's total
- [ ] Update `buildInitialTransactionFilters` in `wallet-selectors.ts` to accept a `categoryId` parameter from search params
- [ ] Update `WalletTransactionFilters` type to include optional `categoryId: string`
- [ ] Update `TransactionsScreen` to read and display the active category filter (show a badge like "Filtro: Comida" with an ✕ to clear)
- [ ] Pass `categoryId` to the `walletApi.getTransactions` call

**Backend dependency:** The existing `GET /wallet/transactions` endpoint must accept a `categoryId` query param. Verify this by checking the server-side route handler. If the endpoint doesn't support it, add the filter server-side (this would be the only backend change in the plan).

**Tests:** No pure-function tests needed — this is wiring + navigation. The existing `buildInitialTransactionFilters` test file should be extended with:
- [ ] Test that `buildInitialTransactionFilters` passes through `categoryId` when present
- [ ] Test that `buildInitialTransactionFilters` omits `categoryId` when absent

---

## Task 3 — Edit Transaction Sheet

**Files:**
- `apps/web/src/features/wallet/presentation/edit-transaction/edit-transaction-sheet.tsx`
- `apps/web/src/features/wallet/presentation/components/transactions-screen.tsx` (modified)

**What:** A bottom-sheet (mobile) / modal (desktop) form pre-filled from an existing transaction. Same UI pattern as `quick-add-expense-sheet.tsx` but for editing.

**Props:**
```typescript
interface EditTransactionSheetProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
}
```

**Behavior:**
- [ ] Pre-fills all form fields from `buildEditFormFromTransaction(transaction)`
- [ ] Shows amount input (large, 2xl text), account select, category chips (from fetched categories), date input, description input
- [ ] Validates on submit via `validateEditTransaction`; shows error if invalid
- [ ] Computes diff via `buildUpdatePayload`; if null, shows "Sin cambios" and closes
- [ ] Calls `updateTransaction({ id: transaction.id, data: payload })` from `useWalletMutations`
- [ ] On success: invalidates wallet queries (already done by mutation), closes sheet
- [ ] Escape key and backdrop click close the sheet
- [ ] `role="dialog"` with `aria-modal="true"` and `aria-label="Editar transaccion"`
- [ ] Spanish copy: "Editar transaccion", "Guardar cambios", "Guardando...", "Sin cambios"
- [ ] Uses existing CSS: `glass-card-static`, `glass-input`, `btn-primary`

**Wire into TransactionsScreen:**
- [ ] Add state: `const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)`
- [ ] Make each transaction row clickable (except the delete button): `onClick={() => setEditingTransaction(transaction)}`
- [ ] Add cursor-pointer to rows
- [ ] Mount sheet: `{editingTransaction && <EditTransactionSheet transaction={editingTransaction} open onClose={() => setEditingTransaction(null)} />}`

---

## Task 4 — Sanity Strip

**Files:**
- `apps/web/src/features/wallet/presentation/sanity-strip/sanity-strip.tsx`
- `apps/web/src/features/wallet/presentation/components/transactions-screen.tsx` (modified)
- `apps/web/src/features/wallet/presentation/components/stats-screen.tsx` (modified)
- `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx` (modified)

**What:** A small, boring, always-visible strip showing: transaction count, total sum, and date range for the current view. Makes the data verifiable at a glance.

**Component:**
```typescript
interface SanityStripProps {
  transactionCount: number;
  totalAmount: string;    // pre-formatted
  dateRange?: { from: string; to: string };
  label?: string;         // e.g. "Gastos" or "Comida"
}
```

**Render:** A single-line `div` with muted text, small font (`text-xs`), showing:
`"{count} movimientos · {totalAmount} · {from} — {to}"`
If no dateRange, omit the date part.

**Mount points:**
- [ ] **TransactionsScreen:** Below the filters bar. Count = `totalTransactions`, totalAmount = sum of visible page (or total from stats if available), dateRange from filter inputs.
- [ ] **StatsScreen:** Inside the "Gastos por categoria" card header. Count = sum of all category counts, totalAmount = sum of all category totals.
- [ ] **DashboardScreen:** Below the stats summary cards. Count = `statsSummary.transactionCount`, totalAmount = `statsSummary.totalExpenses` (labeled "en gastos").

The strip is a pure presentational component — no data fetching. Each parent provides the props.

---

## Task 5 — Wire Edit Sheet into Dashboard Recent Transactions

**Files modified:**
- `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx`
- `apps/web/src/app/(domain)/wallet/components/recent-transactions.tsx`

**What:** The dashboard's "Transacciones recientes" list should also support click-to-edit, not just the full transactions page. Users see a recent expense on the dashboard, tap it, fix the category or amount, done.

**Steps:**
- [ ] Add `editingTransaction` state to dashboard (or lift to a shared context if the recent-transactions component is separate)
- [ ] Make each recent transaction row clickable → opens `EditTransactionSheet`
- [ ] Mount `EditTransactionSheet` with conditional rendering (same pattern as quick-add sheet)

---

## Task 6 — Manual Verification (preview workflow)

> This task is not committed. It confirms end-to-end behavior against the dev server.

- [ ] Step 1: Start the dev preview using `preview_start` (web-preview on port 3100)
- [ ] Step 2: Login with dev credentials, navigate to `/wallet`
- [ ] Step 3: Seed test data — create account + categories + 3 transactions with different categories
- [ ] Step 4: Navigate to `/wallet/transactions`, verify sanity strip shows correct count/total
- [ ] Step 5: Click a transaction row → verify edit sheet opens pre-filled
- [ ] Step 6: Change the category, save → verify transaction list updates, sanity strip recalculates
- [ ] Step 7: Navigate to `/wallet/stats`, verify sanity strip in category breakdown
- [ ] Step 8: Click a category in the legend → verify navigation to `/wallet/transactions?categoryId=...` with filtered results
- [ ] Step 9: Clean up test data, `preview_stop`

---

## Always-On: Core Trust Check

Before marking any task complete, verify:
- [ ] `tsc --noEmit` clean
- [ ] All tests pass (`pnpm --filter @vdp/web test`)
- [ ] No `console.log` in committed code
- [ ] No hardcoded secrets
- [ ] Spanish error messages used throughout
- [ ] Immutable state updates (no mutation)

---

## Dependency Graph

```
Task 1 (edit form state) ─────► Task 3 (edit sheet) ─────► Task 5 (dashboard wire-up)
                                                  │
Task 2 (category drill-down) ──────────────────── │ ──► Task 6 (verification)
                                                  │
Task 4 (sanity strip) ────────────────────────────┘
```

Tasks 1, 2, and 4 are independent and can be parallelized. Task 3 depends on Task 1. Task 5 depends on Task 3. Task 6 depends on all.
