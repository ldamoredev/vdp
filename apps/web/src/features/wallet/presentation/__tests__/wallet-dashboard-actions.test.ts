import React, { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useWalletDataMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => createElement("a", { href, className }, children),
}));

vi.mock("../use-wallet-context", () => ({
  useWalletData: () => useWalletDataMock(),
}));

import { DashboardScreen } from "../components/dashboard-screen";
import { RecentTransactions } from "../components/recent-transactions";

beforeEach(() => {
  globalThis.React = React;
  useWalletDataMock.mockReset();
});

describe("wallet dashboard actions", () => {
  it("shows a direct CTA to create a transaction when there are no movements", () => {
    const markup = renderToStaticMarkup(
      createElement(RecentTransactions, {
        transactions: [],
        isLoading: false,
      }),
    );

    expect(markup).toContain("/wallet/transactions/new");
    expect(markup).toContain("Registrar movimiento");
  });

  it("renders direct dashboard entry points for the daily loop", () => {
    useWalletDataMock.mockReturnValue({
      accounts: [],
      recentTransactions: [
        {
          id: "txn-1",
          accountId: "acc-1",
          categoryId: null,
          type: "expense",
          amount: "1500",
          currency: "ARS",
          description: "Supermercado",
          date: "2026-04-05",
          tags: [],
          createdAt: "2026-04-05T12:00:00.000Z",
        },
      ],
      statsSummary: {
        totalIncome: "10000",
        totalExpenses: "2500",
        netBalance: "7500",
        transactionCount: 1,
      },
      isLoadingAccounts: false,
      isLoadingRecentTransactions: false,
      isLoadingStatsSummary: false,
    });

    const markup = renderToStaticMarkup(createElement(DashboardScreen));

    expect(markup).toContain("Resumen operativo");
    expect(markup).toContain("/wallet/transactions/new");
    expect(markup).toContain("Nueva transaccion");
    expect(markup).toContain("/wallet/stats");
    expect(markup).toContain("Ver estadisticas");
    expect(markup).toContain("Transacciones recientes");
    expect(markup).toContain("Ver todas");
  });
});
