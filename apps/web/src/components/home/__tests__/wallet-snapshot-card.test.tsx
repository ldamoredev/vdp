import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { WalletSnapshotCard } from "../wallet-snapshot-card";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe("WalletSnapshotCard", () => {
  it("shows balance and expense totals with a quick link to create a transaction", () => {
    const markup = renderToStaticMarkup(
      <WalletSnapshotCard
        stats={{
          totalIncome: "12500.5",
          totalExpenses: "8400.25",
          netBalance: "4100.25",
          transactionCount: 12,
        }}
        recentTransactions={[
          {
            id: "txn-1",
            accountId: "acc-1",
            categoryId: null,
            type: "expense",
            amount: "1599.99",
            currency: "ARS",
            description: "Coffee run",
            date: "2026-04-05",
            tags: [],
            createdAt: "2026-04-05T09:00:00.000Z",
          },
          {
            id: "txn-2",
            accountId: "acc-1",
            categoryId: null,
            type: "income",
            amount: "2200",
            currency: "ARS",
            description: "Invoice payment",
            date: "2026-04-04",
            tags: [],
            createdAt: "2026-04-04T09:00:00.000Z",
          },
        ]}
      />,
    );

    expect(markup).toContain("Resumen Wallet");
    expect(markup).toContain("Balance neto");
    expect(markup).toContain("Ingresos");
    expect(markup).toContain("Gastos");
    expect(markup).toContain("Nueva transaccion");
    expect(markup).toContain("/wallet/transactions/new");
    expect(markup).toContain("Coffee run");
  });
});
