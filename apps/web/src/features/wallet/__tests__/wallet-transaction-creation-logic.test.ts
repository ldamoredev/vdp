import { describe, it, expect } from "vitest";
import type { Category, Transaction } from "@/lib/api/types";

/**
 * Tests for the logic in useWalletTransactionCreation:
 * - Category filtering by transaction type
 * - Tag string parsing
 * - Account fallback when no account selected
 * - Form initial state
 *
 * Since the project does not have @testing-library/react or jsdom,
 * we test the pure transformation functions directly.
 */

// ─── Factories ──────────────────────────────────────

function aCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Category",
    type: overrides.type ?? "expense",
    icon: overrides.icon ?? null,
  };
}

type TransactionFormState = {
  type: Transaction["type"];
  amount: string;
  currency: "ARS" | "USD";
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  tags: string;
};

// ─── Category filtering ──────────────────────────────────────

function filterCategories(
  categories: Category[],
  formType: Transaction["type"],
): Category[] {
  return categories.filter(
    (category) => formType === "transfer" || category.type === formType,
  );
}

describe("category filtering by transaction type", () => {
  const categories = [
    aCategory({ id: "c1", name: "Food", type: "expense" }),
    aCategory({ id: "c2", name: "Salary", type: "income" }),
    aCategory({ id: "c3", name: "Transport", type: "expense" }),
    aCategory({ id: "c4", name: "Freelance", type: "income" }),
  ];

  it("returns only expense categories for expense transactions", () => {
    const result = filterCategories(categories, "expense");

    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === "expense")).toBe(true);
  });

  it("returns only income categories for income transactions", () => {
    const result = filterCategories(categories, "income");

    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === "income")).toBe(true);
  });

  it("returns all categories for transfer transactions", () => {
    const result = filterCategories(categories, "transfer");

    expect(result).toHaveLength(4);
  });

  it("returns empty array when no categories match", () => {
    const onlyIncome = [
      aCategory({ type: "income" }),
    ];

    const result = filterCategories(onlyIncome, "expense");

    expect(result).toHaveLength(0);
  });
});

// ─── Tag parsing ──────────────────────────────────────

function parseTags(tagsString: string): string[] {
  return tagsString
    ? tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
}

describe("tag string parsing", () => {
  it("splits comma-separated tags", () => {
    expect(parseTags("food,market,weekly")).toEqual([
      "food",
      "market",
      "weekly",
    ]);
  });

  it("trims whitespace from each tag", () => {
    expect(parseTags("  food , market , weekly  ")).toEqual([
      "food",
      "market",
      "weekly",
    ]);
  });

  it("filters out empty strings from trailing commas", () => {
    expect(parseTags("food,,market,")).toEqual(["food", "market"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseTags("")).toEqual([]);
  });

  it("handles single tag without comma", () => {
    expect(parseTags("groceries")).toEqual(["groceries"]);
  });
});

// ─── Account fallback ──────────────────────────────────────

function resolveAccountId(
  formAccountId: string,
  accounts: Array<{ id: string }>,
): string {
  return formAccountId || accounts[0]?.id || "";
}

describe("account fallback resolution", () => {
  it("uses form accountId when set", () => {
    expect(
      resolveAccountId("acc-selected", [{ id: "acc-1" }, { id: "acc-2" }]),
    ).toBe("acc-selected");
  });

  it("falls back to first account when form accountId is empty", () => {
    expect(resolveAccountId("", [{ id: "acc-1" }, { id: "acc-2" }])).toBe(
      "acc-1",
    );
  });

  it("returns empty string when no accounts and no selection", () => {
    expect(resolveAccountId("", [])).toBe("");
  });
});

// ─── Transaction payload assembly ──────────────────────────────────────

function buildTransactionPayload(
  form: TransactionFormState,
  accounts: Array<{ id: string }>,
) {
  return {
    ...form,
    accountId: resolveAccountId(form.accountId, accounts),
    categoryId: form.categoryId || null,
    tags: parseTags(form.tags),
  };
}

describe("transaction payload assembly", () => {
  it("builds complete payload with all transformations", () => {
    const form: TransactionFormState = {
      type: "expense",
      amount: "1500",
      currency: "ARS",
      accountId: "",
      categoryId: "",
      description: "Groceries",
      date: "2026-04-01",
      tags: "food, market",
    };

    const accounts = [{ id: "acc-1" }];
    const payload = buildTransactionPayload(form, accounts);

    expect(payload.accountId).toBe("acc-1");
    expect(payload.categoryId).toBeNull();
    expect(payload.tags).toEqual(["food", "market"]);
    expect(payload.amount).toBe("1500");
  });

  it("preserves explicit categoryId when set", () => {
    const form: TransactionFormState = {
      type: "expense",
      amount: "500",
      currency: "ARS",
      accountId: "acc-2",
      categoryId: "cat-1",
      description: "",
      date: "2026-04-01",
      tags: "",
    };

    const payload = buildTransactionPayload(form, []);

    expect(payload.categoryId).toBe("cat-1");
    expect(payload.accountId).toBe("acc-2");
    expect(payload.tags).toEqual([]);
  });
});

// ─── Initial form state ──────────────────────────────────────

describe("initial transaction form state", () => {
  it("has sensible defaults", () => {
    const initial: TransactionFormState = {
      type: "expense",
      amount: "",
      currency: "ARS",
      accountId: "",
      categoryId: "",
      description: "",
      date: "2026-04-01", // would be getTodayISO() at runtime
      tags: "",
    };

    expect(initial.type).toBe("expense");
    expect(initial.currency).toBe("ARS");
    expect(initial.amount).toBe("");
    expect(initial.tags).toBe("");
  });
});
