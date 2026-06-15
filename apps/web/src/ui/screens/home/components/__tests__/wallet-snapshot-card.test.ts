import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { HomeWalletSnapshotViewModel } from "@/ui/models/home/HomeViewModel";
import { WalletSnapshotCard } from "../wallet-snapshot-card";

vi.mock("react-router", () => ({
  Link: ({
    to,
    children,
  }: {
    to: string;
    children: ReactNode;
  }) => createElement("a", { href: to }, children),
  useNavigate: () => () => {},
  useLocation: () => ({ pathname: "/" }),
  useSearchParams: () => [new URLSearchParams(), () => {}],
}));

function wallet(overrides: Partial<HomeWalletSnapshotViewModel> = {}): HomeWalletSnapshotViewModel {
  return {
    isLoading: false,
    netBalanceLabel: "$ 4.100,25",
    incomeLabel: "+$ 12.500,50",
    expensesLabel: "-$ 8.400,25",
    transactionCountLabel: "12 movimientos",
    activityLabel: "Ayer",
    recentTransactions: [
      {
        id: "txn-1",
        descriptionLabel: "Coffee run",
        dateLabel: "04 abr 2026",
        amountLabel: "-$ 1.599,99",
        tone: "expense",
      },
      {
        id: "txn-2",
        descriptionLabel: "Invoice payment",
        dateLabel: "03 abr 2026",
        amountLabel: "+$ 2.200,00",
        tone: "income",
      },
    ],
    ...overrides,
  };
}

describe("WalletSnapshotCard", () => {
  it("shows a loading state while wallet data is still resolving", () => {
    const markup = renderToStaticMarkup(
      createElement(WalletSnapshotCard, {
        model: wallet({ isLoading: true, recentTransactions: [] }),
      }),
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("12 movimientos");
    expect(markup).not.toContain("Todavia no hay movimientos recientes");
  });

  it("renders the snapshot supplied by the presenter", () => {
    const markup = renderToStaticMarkup(
      createElement(WalletSnapshotCard, { model: wallet() }),
    );

    expect(markup).toContain("Resumen Wallet");
    expect(markup).toContain("Balance neto");
    expect(markup).toContain("Ingresos");
    expect(markup).toContain("Gastos");
    expect(markup).toContain("Nueva transaccion");
    expect(markup).toContain("/wallet/transactions/new");
    expect(markup).toContain("Coffee run");
    expect(markup).toContain("Ayer");
  });
});
