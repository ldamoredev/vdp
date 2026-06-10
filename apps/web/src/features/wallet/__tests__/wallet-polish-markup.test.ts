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

  it("renders the wallet empty state title and action", () => {
    const markup = renderToStaticMarkup(
      createElement(WalletEmptyState, {
        title: "Todavía no hay movimientos",
        body: "Cuando registres ingresos o gastos, los vas a ver ordenados y listos para revisar.",
        ctaLabel: "Registrar movimiento",
        ctaHref: "/wallet/transactions/new",
      }),
    );

    expect(markup).toContain("Todavía no hay movimientos");
    expect(markup).toContain("Registrar movimiento");
    expect(markup).toContain("/wallet/transactions/new");
  });
});
