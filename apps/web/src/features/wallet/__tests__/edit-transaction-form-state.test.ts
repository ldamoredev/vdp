import { describe, it, expect } from "vitest";
import type { Transaction } from "@/lib/api/types";
import {
  buildEditFormFromTransaction,
  validateEditTransaction,
  buildUpdatePayload,
} from "../edit-transaction/edit-transaction-form-state";

function aTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    accountId: "acc-1",
    categoryId: "cat-food",
    type: "expense",
    amount: "1500",
    currency: "ARS",
    description: "Almuerzo",
    date: "2026-04-08",
    tags: [],
    createdAt: "2026-04-08T12:00:00Z",
    ...overrides,
  };
}

describe("buildEditFormFromTransaction", () => {
  it("hydrates form from a transaction correctly", () => {
    const txn = aTransaction();
    const form = buildEditFormFromTransaction(txn);

    expect(form).toEqual({
      amount: "1500",
      categoryId: "cat-food",
      description: "Almuerzo",
      date: "2026-04-08",
      accountId: "acc-1",
    });
  });

  it("maps null categoryId to empty string", () => {
    const txn = aTransaction({ categoryId: null });
    const form = buildEditFormFromTransaction(txn);

    expect(form.categoryId).toBe("");
  });

  it("maps null description to empty string", () => {
    const txn = aTransaction({ description: null });
    const form = buildEditFormFromTransaction(txn);

    expect(form.description).toBe("");
  });
});

describe("validateEditTransaction", () => {
  function aValidForm() {
    return buildEditFormFromTransaction(aTransaction());
  }

  it("rejects empty amount", () => {
    expect(
      validateEditTransaction({ ...aValidForm(), amount: "" }),
    ).toEqual({ field: "amount", message: "Ingresá un monto" });
  });

  it("rejects non-numeric amount", () => {
    expect(
      validateEditTransaction({ ...aValidForm(), amount: "abc" }),
    ).toEqual({ field: "amount", message: "El monto no es un número válido" });
  });

  it("rejects zero amount", () => {
    expect(
      validateEditTransaction({ ...aValidForm(), amount: "0" }),
    ).toEqual({ field: "amount", message: "El monto debe ser mayor a cero" });
  });

  it("rejects negative amount", () => {
    expect(
      validateEditTransaction({ ...aValidForm(), amount: "-50" }),
    ).toEqual({ field: "amount", message: "El monto debe ser mayor a cero" });
  });

  it("rejects empty date", () => {
    expect(
      validateEditTransaction({ ...aValidForm(), date: "" }),
    ).toEqual({ field: "date", message: "Ingresá una fecha" });
  });

  it("rejects empty accountId", () => {
    expect(
      validateEditTransaction({ ...aValidForm(), accountId: "" }),
    ).toEqual({ field: "accountId", message: "Elegí una cuenta" });
  });

  it("returns null for a valid form", () => {
    expect(validateEditTransaction(aValidForm())).toBeNull();
  });
});

describe("buildUpdatePayload", () => {
  it("returns null when nothing changed", () => {
    const txn = aTransaction();
    const form = buildEditFormFromTransaction(txn);

    expect(buildUpdatePayload(txn, form)).toBeNull();
  });

  it("returns only changed fields (amount only)", () => {
    const txn = aTransaction();
    const form = { ...buildEditFormFromTransaction(txn), amount: "2000" };

    expect(buildUpdatePayload(txn, form)).toEqual({ amount: "2000" });
  });

  it("converts empty categoryId to null", () => {
    const txn = aTransaction({ categoryId: "cat-food" });
    const form = { ...buildEditFormFromTransaction(txn), categoryId: "" };

    expect(buildUpdatePayload(txn, form)).toEqual({ categoryId: null });
  });

  it("trims description and converts empty to null", () => {
    const txn = aTransaction({ description: "Almuerzo" });
    const form = { ...buildEditFormFromTransaction(txn), description: "   " };

    expect(buildUpdatePayload(txn, form)).toEqual({ description: null });
  });

  it("trims description when changed", () => {
    const txn = aTransaction({ description: "Almuerzo" });
    const form = {
      ...buildEditFormFromTransaction(txn),
      description: "  Cena  ",
    };

    expect(buildUpdatePayload(txn, form)).toEqual({ description: "Cena" });
  });
});
