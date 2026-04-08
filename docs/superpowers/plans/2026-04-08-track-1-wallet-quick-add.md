# Track 1 — Wallet Quick-Add Expense Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-first quick-add expense surface that lets the user log an expense in under 5 seconds with smart defaults inferred from recent transactions, accessible directly from the Wallet dashboard.

**Architecture:** Build a focused `quick-add` slice inside `apps/web/src/features/wallet/presentation/`. Pure logic for smart defaults lives in a tested standalone module. A small React hook composes the existing `walletApi.createTransaction` mutation with that defaults logic. A bottom-sheet style component renders the minimal form (amount + category chips + save) and is opened from a dashboard FAB on `/wallet`. No backend changes — the existing `POST /api/wallet/transactions` endpoint already accepts everything we need.

**Tech Stack:** Next.js 15, React 19, TanStack Query 5, TypeScript 5.7, Vitest 3, Tailwind v4. No DOM testing library — tests target pure functions, matching the existing pattern in `apps/web/src/features/wallet/presentation/__tests__/wallet-transaction-creation-logic.test.ts`.

---

## Spec Reference

This plan implements **Track 1 (Wallet Capture)** from `docs/superpowers/specs/2026-04-08-product-clarity-and-real-value-design.md`. Done signal from the spec:

> Real expenses get logged in the moment they happen, on mobile, without thinking about the UI. Expense entries stop being deferred.

This plan covers Option A (mobile-friendly quick-add UI). Chat-driven capture and global keyboard shortcuts are deferred to follow-up plans within the same Track 1.

## Out of Scope (for this plan)

- Receipt scanning, OCR, bank sync, multi-currency normalization.
- Income/transfer quick capture — quick-add is **expense-only** in this plan. Other types stay on the existing `/wallet/transactions/new` form.
- Editing or deleting from the quick-add surface — the existing transaction form covers that.
- Chat-driven capture (separate plan).
- Global keyboard shortcut / command palette entry (separate plan).
- Backend changes — none needed.

## File Structure

**New files:**

- `apps/web/src/features/wallet/presentation/quick-add/quick-add-defaults.ts` — pure functions: pick default account, default category, default currency from a list of recent transactions.
- `apps/web/src/features/wallet/presentation/quick-add/quick-add-form-state.ts` — pure functions: build initial form state, validate form state, build the create-transaction payload.
- `apps/web/src/features/wallet/presentation/quick-add/use-quick-add-expense.ts` — React hook that wires queries (accounts, categories, recent transactions), defaults, form state, and the create mutation.
- `apps/web/src/features/wallet/presentation/quick-add/quick-add-expense-sheet.tsx` — the mobile-first sheet UI component.
- `apps/web/src/features/wallet/presentation/__tests__/quick-add-defaults.test.ts` — tests for `quick-add-defaults.ts`.
- `apps/web/src/features/wallet/presentation/__tests__/quick-add-form-state.test.ts` — tests for `quick-add-form-state.ts`.

**Modified files:**

- `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx` — mount the quick-add sheet and a floating "+" trigger button visible on all viewports.

That's it. Six files total. Each one has one clear responsibility. No file is over 200 lines.

---

## Task 1 — Smart Defaults (pure logic + tests)

The smart-defaults module decides which account, category, and currency to pre-select for a new expense given (a) the available accounts, (b) the available expense categories, and (c) the user's recent transactions. The rule: most-frequently-used in the last N expense transactions wins; fall back to the first available item.

**Files:**
- Create: `apps/web/src/features/wallet/presentation/quick-add/quick-add-defaults.ts`
- Test: `apps/web/src/features/wallet/presentation/__tests__/quick-add-defaults.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/features/wallet/presentation/__tests__/quick-add-defaults.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { Account, Category, Transaction } from "@/lib/api/types";
import {
  pickDefaultAccountId,
  pickDefaultCategoryId,
  pickDefaultCurrency,
} from "../quick-add/quick-add-defaults";

function anAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Account",
    type: overrides.type ?? "cash",
    currency: overrides.currency ?? "ARS",
    initialBalance: overrides.initialBalance ?? "0",
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? "2026-04-08T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-08T00:00:00.000Z",
  };
}

function aCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Category",
    type: overrides.type ?? "expense",
    icon: overrides.icon ?? null,
  };
}

function anExpense(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    accountId: overrides.accountId ?? "acc-default",
    categoryId: overrides.categoryId ?? null,
    type: overrides.type ?? "expense",
    amount: overrides.amount ?? "100",
    currency: overrides.currency ?? "ARS",
    description: overrides.description ?? null,
    date: overrides.date ?? "2026-04-08",
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? "2026-04-08T00:00:00.000Z",
  };
}

// AccountType union from @vdp/shared is "cash" | "bank" | "crypto" | "investment".

describe("pickDefaultAccountId", () => {
  it("returns the most-used account from recent expense transactions", () => {
    const accounts = [
      anAccount({ id: "acc-1" }),
      anAccount({ id: "acc-2" }),
      anAccount({ id: "acc-3" }),
    ];
    const recent = [
      anExpense({ accountId: "acc-2" }),
      anExpense({ accountId: "acc-1" }),
      anExpense({ accountId: "acc-2" }),
    ];

    expect(pickDefaultAccountId(accounts, recent)).toBe("acc-2");
  });

  it("falls back to the first account when there are no recent transactions", () => {
    const accounts = [anAccount({ id: "acc-1" }), anAccount({ id: "acc-2" })];

    expect(pickDefaultAccountId(accounts, [])).toBe("acc-1");
  });

  it("ignores recent transactions whose account no longer exists", () => {
    const accounts = [anAccount({ id: "acc-1" })];
    const recent = [
      anExpense({ accountId: "acc-removed" }),
      anExpense({ accountId: "acc-removed" }),
    ];

    expect(pickDefaultAccountId(accounts, recent)).toBe("acc-1");
  });

  it("returns empty string when there are no accounts", () => {
    expect(pickDefaultAccountId([], [])).toBe("");
  });
});

describe("pickDefaultCategoryId", () => {
  it("returns the most-used expense category from recent expense transactions", () => {
    const categories = [
      aCategory({ id: "cat-food", type: "expense" }),
      aCategory({ id: "cat-fuel", type: "expense" }),
    ];
    const recent = [
      anExpense({ categoryId: "cat-fuel" }),
      anExpense({ categoryId: "cat-food" }),
      anExpense({ categoryId: "cat-fuel" }),
    ];

    expect(pickDefaultCategoryId(categories, recent)).toBe("cat-fuel");
  });

  it("ignores income transactions when picking the default expense category", () => {
    const categories = [aCategory({ id: "cat-food", type: "expense" })];
    const recent = [
      anExpense({ type: "income", categoryId: "cat-salary" }),
      anExpense({ type: "income", categoryId: "cat-salary" }),
      anExpense({ type: "expense", categoryId: "cat-food" }),
    ];

    expect(pickDefaultCategoryId(categories, recent)).toBe("cat-food");
  });

  it("falls back to the first expense category when there is no history", () => {
    const categories = [
      aCategory({ id: "cat-food", type: "expense" }),
      aCategory({ id: "cat-fuel", type: "expense" }),
    ];

    expect(pickDefaultCategoryId(categories, [])).toBe("cat-food");
  });

  it("returns empty string when there are no expense categories", () => {
    const categories = [aCategory({ id: "cat-salary", type: "income" })];

    expect(pickDefaultCategoryId(categories, [])).toBe("");
  });
});

describe("pickDefaultCurrency", () => {
  it("returns the currency of the picked default account", () => {
    const accounts = [
      anAccount({ id: "acc-1", currency: "USD" }),
      anAccount({ id: "acc-2", currency: "ARS" }),
    ];

    expect(pickDefaultCurrency(accounts, "acc-2")).toBe("ARS");
  });

  it("falls back to ARS when the account is not found", () => {
    expect(pickDefaultCurrency([], "missing")).toBe("ARS");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/quick-add-defaults.test.ts`
Expected: FAIL with "Cannot find module '../quick-add/quick-add-defaults'" or equivalent.

- [ ] **Step 3: Write the minimal implementation**

Create `apps/web/src/features/wallet/presentation/quick-add/quick-add-defaults.ts`:

```typescript
import type { Account, Category, Currency, Transaction } from "@/lib/api/types";

function pickMostFrequent<T extends string>(values: readonly T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let bestValue: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestValue = value;
    }
  }
  return bestValue;
}

export function pickDefaultAccountId(
  accounts: readonly Account[],
  recentTransactions: readonly Transaction[],
): string {
  if (accounts.length === 0) return "";
  const validIds = new Set(accounts.map((account) => account.id));
  const usedAccountIds = recentTransactions
    .filter((transaction) => transaction.type === "expense")
    .map((transaction) => transaction.accountId)
    .filter((id): id is string => typeof id === "string" && validIds.has(id));
  const mostFrequent = pickMostFrequent(usedAccountIds);
  return mostFrequent ?? accounts[0].id;
}

export function pickDefaultCategoryId(
  categories: readonly Category[],
  recentTransactions: readonly Transaction[],
): string {
  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );
  if (expenseCategories.length === 0) return "";
  const validIds = new Set(expenseCategories.map((category) => category.id));
  const usedCategoryIds = recentTransactions
    .filter((transaction) => transaction.type === "expense")
    .map((transaction) => transaction.categoryId)
    .filter((id): id is string => typeof id === "string" && validIds.has(id));
  const mostFrequent = pickMostFrequent(usedCategoryIds);
  return mostFrequent ?? expenseCategories[0].id;
}

export function pickDefaultCurrency(
  accounts: readonly Account[],
  defaultAccountId: string,
): Currency {
  const account = accounts.find((candidate) => candidate.id === defaultAccountId);
  return account?.currency ?? "ARS";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/quick-add-defaults.test.ts`
Expected: PASS, all 11 cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/wallet/presentation/quick-add/quick-add-defaults.ts apps/web/src/features/wallet/presentation/__tests__/quick-add-defaults.test.ts
git commit -m "feat: add quick-add expense default selection"
```

---

## Task 2 — Quick-Add Form State (pure logic + tests)

The form state module owns the shape of the quick-add form, building the initial state from defaults, validating user input, and producing the API payload. Keeping this as pure functions means the React hook in Task 3 stays small and testable.

**Files:**
- Create: `apps/web/src/features/wallet/presentation/quick-add/quick-add-form-state.ts`
- Test: `apps/web/src/features/wallet/presentation/__tests__/quick-add-form-state.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/features/wallet/presentation/__tests__/quick-add-form-state.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildInitialQuickAddForm,
  validateQuickAddForm,
  buildCreateTransactionPayload,
  type QuickAddFormState,
} from "../quick-add/quick-add-form-state";

describe("buildInitialQuickAddForm", () => {
  it("uses the provided defaults and a blank amount", () => {
    const form = buildInitialQuickAddForm({
      accountId: "acc-1",
      categoryId: "cat-food",
      currency: "ARS",
      todayISO: "2026-04-08",
    });

    expect(form).toEqual({
      amount: "",
      accountId: "acc-1",
      categoryId: "cat-food",
      currency: "ARS",
      description: "",
      date: "2026-04-08",
    });
  });
});

describe("validateQuickAddForm", () => {
  function aValidForm(overrides: Partial<QuickAddFormState> = {}): QuickAddFormState {
    return {
      amount: "1500",
      accountId: "acc-1",
      categoryId: "cat-food",
      currency: "ARS",
      description: "",
      date: "2026-04-08",
      ...overrides,
    };
  }

  it("returns null for a valid form", () => {
    expect(validateQuickAddForm(aValidForm())).toBeNull();
  });

  it("rejects an empty amount", () => {
    expect(validateQuickAddForm(aValidForm({ amount: "" }))).toBe(
      "Ingresá un monto",
    );
  });

  it("rejects zero or negative amounts", () => {
    expect(validateQuickAddForm(aValidForm({ amount: "0" }))).toBe(
      "El monto debe ser mayor a cero",
    );
    expect(validateQuickAddForm(aValidForm({ amount: "-50" }))).toBe(
      "El monto debe ser mayor a cero",
    );
  });

  it("rejects non-numeric amounts", () => {
    expect(validateQuickAddForm(aValidForm({ amount: "abc" }))).toBe(
      "El monto no es un número válido",
    );
  });

  it("rejects missing account", () => {
    expect(validateQuickAddForm(aValidForm({ accountId: "" }))).toBe(
      "Elegí una cuenta",
    );
  });

  it("allows missing category (uncategorized expense)", () => {
    expect(validateQuickAddForm(aValidForm({ categoryId: "" }))).toBeNull();
  });
});

describe("buildCreateTransactionPayload", () => {
  it("converts the form state into a create-transaction request body", () => {
    const form: QuickAddFormState = {
      amount: "1500",
      accountId: "acc-1",
      categoryId: "cat-food",
      currency: "ARS",
      description: "Almuerzo",
      date: "2026-04-08",
    };

    expect(buildCreateTransactionPayload(form)).toEqual({
      type: "expense",
      amount: "1500",
      currency: "ARS",
      accountId: "acc-1",
      categoryId: "cat-food",
      description: "Almuerzo",
      date: "2026-04-08",
      tags: [],
    });
  });

  it("sends categoryId as null when no category is selected", () => {
    const form: QuickAddFormState = {
      amount: "1500",
      accountId: "acc-1",
      categoryId: "",
      currency: "ARS",
      description: "",
      date: "2026-04-08",
    };

    const payload = buildCreateTransactionPayload(form);
    expect(payload.categoryId).toBeNull();
  });

  it("sends description as null when blank", () => {
    const form: QuickAddFormState = {
      amount: "1500",
      accountId: "acc-1",
      categoryId: "cat-food",
      currency: "ARS",
      description: "   ",
      date: "2026-04-08",
    };

    const payload = buildCreateTransactionPayload(form);
    expect(payload.description).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/quick-add-form-state.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Write the minimal implementation**

Create `apps/web/src/features/wallet/presentation/quick-add/quick-add-form-state.ts`:

```typescript
import type { Currency } from "@/lib/api/types";

export interface QuickAddFormState {
  amount: string;
  accountId: string;
  categoryId: string;
  currency: Currency;
  description: string;
  date: string;
}

export interface QuickAddDefaults {
  accountId: string;
  categoryId: string;
  currency: Currency;
  todayISO: string;
}

export interface CreateTransactionPayload {
  type: "expense";
  amount: string;
  currency: Currency;
  accountId: string;
  categoryId: string | null;
  description: string | null;
  date: string;
  tags: string[];
}

export function buildInitialQuickAddForm(
  defaults: QuickAddDefaults,
): QuickAddFormState {
  return {
    amount: "",
    accountId: defaults.accountId,
    categoryId: defaults.categoryId,
    currency: defaults.currency,
    description: "",
    date: defaults.todayISO,
  };
}

export function validateQuickAddForm(form: QuickAddFormState): string | null {
  if (form.amount.trim() === "") return "Ingresá un monto";
  const numericAmount = Number(form.amount);
  if (Number.isNaN(numericAmount)) return "El monto no es un número válido";
  if (numericAmount <= 0) return "El monto debe ser mayor a cero";
  if (form.accountId.trim() === "") return "Elegí una cuenta";
  return null;
}

export function buildCreateTransactionPayload(
  form: QuickAddFormState,
): CreateTransactionPayload {
  const trimmedDescription = form.description.trim();
  return {
    type: "expense",
    amount: form.amount,
    currency: form.currency,
    accountId: form.accountId,
    categoryId: form.categoryId === "" ? null : form.categoryId,
    description: trimmedDescription === "" ? null : trimmedDescription,
    date: form.date,
    tags: [],
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @vdp/web test src/features/wallet/presentation/__tests__/quick-add-form-state.test.ts`
Expected: PASS, all 10 cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/wallet/presentation/quick-add/quick-add-form-state.ts apps/web/src/features/wallet/presentation/__tests__/quick-add-form-state.test.ts
git commit -m "feat: add quick-add form state and validation"
```

---

## Task 3 — `useQuickAddExpense` Hook (composition)

This hook composes the existing wallet queries (accounts, categories, recent transactions) with the pure logic from Tasks 1 and 2 and the existing `walletApi.createTransaction` mutation. It exposes a small surface for the UI in Task 4.

There is no unit test for this hook because the project does not include `@testing-library/react` or `jsdom` (see the comment in `apps/web/src/features/wallet/presentation/__tests__/wallet-transaction-creation-logic.test.ts`). The pure logic it composes is already covered by Tasks 1–2; the hook itself is thin glue.

**Files:**
- Create: `apps/web/src/features/wallet/presentation/quick-add/use-quick-add-expense.ts`

- [ ] **Step 1: Write the hook**

Create `apps/web/src/features/wallet/presentation/quick-add/use-quick-add-expense.ts`:

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { walletApi } from "@/lib/api/wallet";
import { getTodayISO } from "@/lib/format";
import type { Account, Category, Currency, Transaction } from "@/lib/api/types";
import { walletQueryKeys } from "../wallet-query-keys";
import {
  pickDefaultAccountId,
  pickDefaultCategoryId,
  pickDefaultCurrency,
} from "./quick-add-defaults";
import {
  buildCreateTransactionPayload,
  buildInitialQuickAddForm,
  validateQuickAddForm,
  type QuickAddFormState,
} from "./quick-add-form-state";

const RECENT_TRANSACTIONS_QUERY_PARAMS = { limit: "20", type: "expense" };

export interface UseQuickAddExpenseResult {
  readonly accounts: Account[];
  readonly expenseCategories: Category[];
  readonly form: QuickAddFormState;
  readonly isReady: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | null;
  readonly setAmount: (value: string) => void;
  readonly setAccountId: (value: string) => void;
  readonly setCategoryId: (value: string) => void;
  readonly setDescription: (value: string) => void;
  readonly submit: () => Promise<boolean>;
  readonly reset: () => void;
}

export function useQuickAddExpense(): UseQuickAddExpenseResult {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: walletQueryKeys.accounts,
    queryFn: walletApi.getAccounts,
  });
  const categoriesQuery = useQuery({
    queryKey: walletQueryKeys.categories,
    queryFn: () => walletApi.getCategories(),
  });
  const recentQuery = useQuery({
    queryKey: [...walletQueryKeys.recentTransactions, "quick-add"] as const,
    queryFn: () => walletApi.getTransactions(RECENT_TRANSACTIONS_QUERY_PARAMS),
  });

  const accounts: Account[] = accountsQuery.data ?? [];
  const categories: Category[] = categoriesQuery.data ?? [];
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories],
  );
  const recentTransactions: Transaction[] = useMemo(() => {
    const data = recentQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data as Transaction[];
    if (Array.isArray((data as { transactions?: Transaction[] }).transactions)) {
      return (data as { transactions: Transaction[] }).transactions;
    }
    return [];
  }, [recentQuery.data]);

  const isReady =
    !accountsQuery.isLoading &&
    !categoriesQuery.isLoading &&
    !recentQuery.isLoading;

  const defaultAccountId = useMemo(
    () => pickDefaultAccountId(accounts, recentTransactions),
    [accounts, recentTransactions],
  );
  const defaultCategoryId = useMemo(
    () => pickDefaultCategoryId(categories, recentTransactions),
    [categories, recentTransactions],
  );
  const defaultCurrency: Currency = useMemo(
    () => pickDefaultCurrency(accounts, defaultAccountId),
    [accounts, defaultAccountId],
  );

  const [form, setForm] = useState<QuickAddFormState>(() =>
    buildInitialQuickAddForm({
      accountId: "",
      categoryId: "",
      currency: "ARS",
      todayISO: getTodayISO(),
    }),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    setForm((current) => ({
      ...current,
      accountId: current.accountId === "" ? defaultAccountId : current.accountId,
      categoryId:
        current.categoryId === "" ? defaultCategoryId : current.categoryId,
      currency: current.accountId === "" ? defaultCurrency : current.currency,
    }));
  }, [isReady, defaultAccountId, defaultCategoryId, defaultCurrency]);

  const mutation = useMutation({
    mutationFn: walletApi.createTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
    },
  });

  function reset(): void {
    setForm(
      buildInitialQuickAddForm({
        accountId: defaultAccountId,
        categoryId: defaultCategoryId,
        currency: defaultCurrency,
        todayISO: getTodayISO(),
      }),
    );
    setValidationError(null);
    mutation.reset();
  }

  async function submit(): Promise<boolean> {
    const error = validateQuickAddForm(form);
    if (error !== null) {
      setValidationError(error);
      return false;
    }
    setValidationError(null);
    try {
      await mutation.mutateAsync(buildCreateTransactionPayload(form));
      reset();
      return true;
    } catch {
      return false;
    }
  }

  const mutationError =
    mutation.error instanceof Error ? mutation.error.message : null;

  return {
    accounts,
    expenseCategories,
    form,
    isReady,
    isSubmitting: mutation.isPending,
    errorMessage: validationError ?? mutationError,
    setAmount: (value) => setForm((current) => ({ ...current, amount: value })),
    setAccountId: (value) => {
      setForm((current) => ({
        ...current,
        accountId: value,
        currency: pickDefaultCurrency(accounts, value),
      }));
    },
    setCategoryId: (value) =>
      setForm((current) => ({ ...current, categoryId: value })),
    setDescription: (value) =>
      setForm((current) => ({ ...current, description: value })),
    submit,
    reset,
  };
}
```

- [ ] **Step 2: Verify the file type-checks**

Run: `pnpm --filter @vdp/web exec tsc --noEmit`
Expected: PASS, no type errors. If `walletApi.getTransactions` returns a different shape than the union handled above, narrow it inline rather than changing the API surface — the goal is to consume what already exists.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/wallet/presentation/quick-add/use-quick-add-expense.ts
git commit -m "feat: add useQuickAddExpense hook"
```

---

## Task 4 — Quick-Add Sheet UI (mobile-first)

The sheet is a bottom-anchored panel on mobile and a centered card on desktop. It contains: a single large amount input (autofocused), a horizontal scrollable row of category chips, an account selector (collapsed by default — only shown if there are 2+ accounts), an optional description field, and a Save button. No date picker (defaults to today, edit on the full form if needed).

**Files:**
- Create: `apps/web/src/features/wallet/presentation/quick-add/quick-add-expense-sheet.tsx`

- [ ] **Step 1: Write the component**

Create `apps/web/src/features/wallet/presentation/quick-add/quick-add-expense-sheet.tsx`:

```typescript
"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useQuickAddExpense } from "./use-quick-add-expense";

interface QuickAddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
}

export function QuickAddExpenseSheet({ open, onClose }: QuickAddExpenseSheetProps) {
  const {
    accounts,
    expenseCategories,
    form,
    isReady,
    isSubmitting,
    errorMessage,
    setAmount,
    setAccountId,
    setCategoryId,
    setDescription,
    submit,
    reset,
  } = useQuickAddExpense();

  const amountInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      amountInputRef.current?.focus();
    } else {
      reset();
    }
    // Intentionally exclude `reset` to avoid re-running on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
    return undefined;
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const ok = await submit();
    if (ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Cargar gasto rápido"
    >
      <div
        className="glass-card-static w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Gasto rápido</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Monto ({form.currency})
            </label>
            <input
              ref={amountInputRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(event) => setAmount(event.target.value)}
              className="glass-input w-full px-4 py-3 text-2xl font-semibold"
              required
              autoFocus
            />
          </div>

          {expenseCategories.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Categoría
              </label>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {expenseCategories.map((category) => {
                  const isSelected = category.id === form.categoryId;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                          : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {accounts.length > 1 && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Cuenta
              </label>
              <select
                value={form.accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Nota (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Almuerzo con amigos"
              value={form.description}
              onChange={(event) => setDescription(event.target.value)}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-[var(--accent-red-glow)] p-3">
              <p className="text-sm text-[var(--accent-red)]">{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isReady}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {isSubmitting ? "Guardando..." : "Guardar gasto"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file type-checks**

Run: `pnpm --filter @vdp/web exec tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/wallet/presentation/quick-add/quick-add-expense-sheet.tsx
git commit -m "feat: add quick-add expense sheet UI"
```

---

## Task 5 — Wire the Sheet into the Wallet Dashboard

Add a floating "+" trigger button to `DashboardScreen` and a local `useState` to control the sheet. The existing "Nueva transacción" link in the header stays — it's the path for non-expense entries (income, transfer) and for users who want the full form.

**Files:**
- Modify: `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx`

- [ ] **Step 1: Modify the dashboard screen**

Edit `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx` to import the sheet, hold its open state, and render a floating action button. The full updated file:

```typescript
"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AccountCard } from "./account-card";
import { RecentTransactions } from "./recent-transactions";
import { SkeletonCard } from "./skeleton";
import { StatsSummary } from "./stats-summary";
import { useWalletData } from "../use-wallet-context";
import { ModulePage } from "@/components/primitives/module-page";
import { QuickAddExpenseSheet } from "../quick-add/quick-add-expense-sheet";

export function DashboardScreen() {
  const {
    accounts,
    recentTransactions,
    statsSummary,
    isLoadingAccounts,
    isLoadingRecentTransactions,
    isLoadingStatsSummary,
  } = useWalletData();
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <ModulePage width="5xl" spacing="8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Resumen de tus finanzas personales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Gasto rápido
          </button>
          <Link href="/wallet/transactions/new" className="btn-secondary">
            Nueva transacción
          </Link>
          <Link href="/wallet/stats" className="btn-secondary">
            Ver estadísticas
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
        {isLoadingAccounts ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))
        )}
      </div>

      {isLoadingStatsSummary ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <StatsSummary stats={statsSummary} />
      )}

      <RecentTransactions
        transactions={recentTransactions}
        isLoading={isLoadingRecentTransactions}
      />

      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Cargar gasto rápido"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 sm:hidden"
      >
        <Plus size={24} />
      </button>

      <QuickAddExpenseSheet
        open={isQuickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </ModulePage>
  );
}
```

- [ ] **Step 2: Type-check and test the suite**

Run: `pnpm --filter @vdp/web exec tsc --noEmit`
Expected: PASS.

Run: `pnpm --filter @vdp/web test`
Expected: PASS — both new test files plus all pre-existing tests stay green.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx
git commit -m "feat: mount quick-add sheet on wallet dashboard"
```

---

## Task 6 — Manual Verification (preview workflow)

Verify the quick-add flow works end-to-end against the dev server before declaring the plan done. This task is not committed.

- [ ] **Step 1: Start the dev preview**

Use the `preview_start` tool to launch `apps/web` against the local server. Confirm the server is reachable.

- [ ] **Step 2: Navigate to `/wallet`**

Use `preview_eval` with `window.location.href = '/wallet'` (or click through `/login` first if auth is required), then `preview_snapshot` to verify the dashboard renders.

- [ ] **Step 3: Open the quick-add sheet**

Click the new "Gasto rápido" button (or the mobile FAB after `preview_resize` to a mobile viewport like 390x844). Snapshot to confirm the sheet opens, the amount input is focused, and category chips render.

- [ ] **Step 4: Submit a real expense**

Fill the amount with `150`, leave the defaulted category, click "Guardar gasto". Use `preview_network` to confirm `POST /api/wallet/transactions` returns 200/201 with an `expense` body. Snapshot the dashboard to confirm the sheet closes and recent transactions update.

- [ ] **Step 5: Capture proof**

Use `preview_screenshot` of the open sheet (mobile viewport) and the dashboard after the new expense lands. Share both with the user.

- [ ] **Step 6: Stop the preview**

Use `preview_stop`.

---

## Always-On — Core Trust Check

Before declaring the plan complete, confirm the standing-rule items from the spec still hold:

- [ ] `pnpm --filter @vdp/web test` is green.
- [ ] `pnpm --filter @vdp/web exec tsc --noEmit` is green.
- [ ] No new error swallowing — every catch in new code surfaces a message via `errorMessage`.
- [ ] No new secrets, no hardcoded URLs, no `console.log` left in shipped code.
- [ ] The existing transaction form path (`/wallet/transactions/new`) still works — quick-add does not replace it, it complements it.
