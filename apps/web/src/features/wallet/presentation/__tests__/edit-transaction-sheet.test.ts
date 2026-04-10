import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/lib/api/types";

const useWalletDataMock = vi.fn();
const useWalletActionsMock = vi.fn();

vi.mock("../use-wallet-context", () => ({
  useWalletData: () => useWalletDataMock(),
  useWalletActions: () => useWalletActionsMock(),
}));

import { EditTransactionSheet } from "../edit-transaction/edit-transaction-sheet";

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

beforeEach(() => {
  globalThis.React = React;
  useWalletDataMock.mockReset();
  useWalletActionsMock.mockReset();

  useWalletDataMock.mockReturnValue({
    accounts: [
      { id: "acc-1", name: "Cuenta sueldo", currency: "ARS" },
      { id: "acc-2", name: "Efectivo", currency: "ARS" },
    ],
    categories: [
      { id: "cat-food", name: "Comida", type: "expense", icon: "🍔" },
      { id: "cat-home", name: "Casa", type: "expense", icon: "🏠" },
      { id: "cat-salary", name: "Sueldo", type: "income", icon: "💼" },
    ],
    isUpdatingTransaction: false,
  });

  useWalletActionsMock.mockReturnValue({
    updateTransaction: vi.fn(),
  });
});

describe("EditTransactionSheet", () => {
  it("renders the prefilled transaction form when open", () => {
    const markup = renderToStaticMarkup(
      createElement(EditTransactionSheet, {
        transaction: aTransaction(),
        open: true,
        onClose: vi.fn(),
      }),
    );

    expect(markup).toContain("Editar transaccion");
    expect(markup).toContain("Guardar cambios");
    expect(markup).toContain('value="1500"');
    expect(markup).toContain('value="Almuerzo"');
    expect(markup).toContain("Comida");
    expect(markup).toContain("Cuenta sueldo");
  });

  it("renders nothing when closed", () => {
    const markup = renderToStaticMarkup(
      createElement(EditTransactionSheet, {
        transaction: aTransaction(),
        open: false,
        onClose: vi.fn(),
      }),
    );

    expect(markup).toBe("");
  });
});
