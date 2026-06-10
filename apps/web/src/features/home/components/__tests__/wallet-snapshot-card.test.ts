import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalletSnapshotCard } from "../wallet-snapshot-card";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href }, children),
}));

afterEach(() => {
  vi.useRealTimers();
});

describe("WalletSnapshotCard", () => {
  it("shows a loading state while wallet data is still resolving", () => {
    const markup = renderToStaticMarkup(
      createElement(WalletSnapshotCard, {
        isLoading: true,
        stats: undefined,
        recentTransactions: [],
      }),
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("0 movimientos");
    expect(markup).not.toContain("Todavia no hay movimientos recientes");
  });

  it("derives the activity badge from the newest transaction date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T12:00:00.000Z"));

    const markup = renderToStaticMarkup(
      createElement(WalletSnapshotCard, {
        stats: {
          totalIncome: "12500.5",
          totalExpenses: "8400.25",
          netBalance: "4100.25",
          transactionCount: 12,
        },
        recentTransactions: [
          {
            id: "txn-1",
            accountId: "acc-1",
            categoryId: null,
            type: "expense",
            amount: "1599.99",
            currency: "ARS",
            description: "Coffee run",
            date: "2026-04-04",
            tags: [],
            createdAt: "2026-04-04T09:00:00.000Z",
          },
          {
            id: "txn-2",
            accountId: "acc-1",
            categoryId: null,
            type: "income",
            amount: "2200",
            currency: "ARS",
            description: "Invoice payment",
            date: "2026-04-03",
            tags: [],
            createdAt: "2026-04-03T09:00:00.000Z",
          },
        ],
      }),
    );

    expect(markup).toContain("Resumen Wallet");
    expect(markup).toContain("Balance neto");
    expect(markup).toContain("Ingresos");
    expect(markup).toContain("Gastos");
    expect(markup).toContain("Nueva transaccion");
    expect(markup).toContain("/wallet/transactions/new");
    expect(markup).toContain("Coffee run");
    expect(markup).toContain("Ayer");
    expect(markup).not.toContain("Hoy");
  });
});
