import React, { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useWalletDataMock = vi.fn();
const useWalletActionsMock = vi.fn();

vi.mock("react-router", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: ReactNode;
    className?: string;
  }) => createElement("a", { href: to, className }, children),
  useNavigate: () => () => {},
  useLocation: () => ({ pathname: "/" }),
  useSearchParams: () => [new URLSearchParams(), () => {}],
}));

vi.mock("../use-wallet-context", () => ({
  useWalletData: () => useWalletDataMock(),
  useWalletActions: () => useWalletActionsMock(),
}));

import { StatsScreen } from "../components/stats-screen";
import { TransactionsScreen } from "../components/transactions-screen";

beforeEach(() => {
  globalThis.React = React;
  useWalletDataMock.mockReset();
  useWalletActionsMock.mockReset();
});

describe("wallet mobile pages", () => {
  it("stacks the stats page header on small screens", () => {
    useWalletDataMock.mockReturnValue({
      byCategory: [],
      monthlyTrend: [],
      dollarRates: [],
      isLoadingByCategory: false,
      isLoadingMonthlyTrend: false,
      isLoadingExchangeRates: false,
    });

    const markup = renderToStaticMarkup(createElement(StatsScreen));

    expect(markup).toContain("Estadisticas");
    expect(markup).toContain("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between");
  });

  it("stacks the transactions page header and keeps filters wrapped", () => {
    useWalletDataMock.mockReturnValue({
      transactions: [],
      totalTransactions: 0,
      transactionFilters: {
        type: "",
        categoryId: "",
        from: "",
        to: "",
      },
      categories: [],
      currentTransactionsPage: 1,
      totalTransactionsPages: 1,
      canGoPreviousTransactionsPage: false,
      canGoNextTransactionsPage: false,
      isLoadingTransactions: false,
    });
    useWalletActionsMock.mockReturnValue({
      setTransactionType: vi.fn(),
      setTransactionCategoryId: vi.fn(),
      setTransactionFrom: vi.fn(),
      setTransactionTo: vi.fn(),
      previousTransactionsPage: vi.fn(),
      nextTransactionsPage: vi.fn(),
      deleteTransaction: vi.fn(),
    });

    const markup = renderToStaticMarkup(createElement(TransactionsScreen));

    expect(markup).toContain("Transacciones");
    expect(markup).toContain("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between");
    expect(markup).toContain("flex flex-wrap items-center gap-3");
  });
});
