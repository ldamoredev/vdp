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
