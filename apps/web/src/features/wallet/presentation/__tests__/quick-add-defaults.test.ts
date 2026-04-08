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
