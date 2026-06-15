import type { Account, Transaction as TransactionDto, WalletStatsSummary } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { Transaction } from "@/core/domain/wallet/Transaction";
import { DashboardPresenter } from "../DashboardPresenter";

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "a1",
    name: "Caja",
    currency: "ARS",
    type: "cash",
    initialBalance: "1000",
    currentBalance: "850",
    isActive: true,
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function transactionDto(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: "tx1",
    accountId: "a1",
    categoryId: null,
    categoryName: undefined,
    type: "expense",
    amount: "150",
    currency: "ARS",
    description: "Super",
    date: "2026-06-14",
    tags: [],
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function stats(overrides: Partial<WalletStatsSummary> = {}): WalletStatsSummary {
  return {
    totalIncome: "1000",
    totalExpenses: "150",
    netBalance: "850",
    transactionCount: 1,
    ...overrides,
  };
}

function build() {
  const gateway = new FakeWalletGateway();
  vi.spyOn(gateway, "getAccounts").mockResolvedValue([account()]);
  vi.spyOn(gateway, "getStatsSummary").mockResolvedValue(stats());
  const getTransactions = vi.spyOn(gateway, "getTransactions").mockResolvedValue({
    transactions: [Transaction.from(transactionDto())],
    total: 1,
  });
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
  const presenter = new DashboardPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway, getTransactions };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("DashboardPresenter", () => {
  it("loads accounts, stats and recent transactions", async () => {
    const { presenter, getTransactions } = build();

    presenter.start();
    await flush();

    expect(getTransactions).toHaveBeenLastCalledWith({ limit: "10" });
    expect(presenter.model.stats.map((item) => item.valueLabel)).toEqual([
      "+$ 1.000,00",
      "-$ 150,00",
      "$ 850,00",
    ]);
    expect(presenter.model.accounts[0].balanceLabel).toBe("$ 850,00");
    expect(presenter.model.recentTransactions[0].descriptionLabel).toBe("Super");
    expect(presenter.model.sanity.totalAmountLabel).toBe("$ 150,00");
  });

  it("opens and saves recent transaction edits, then reloads", async () => {
    const { presenter, gateway, getTransactions } = build();
    const updateTransaction = vi.spyOn(gateway, "updateTransaction");
    presenter.start();
    await flush();

    presenter.openEdit("tx1");
    presenter.setEditField("amount", "175");
    presenter.setEditField("description", "");
    await presenter.submitEdit();

    expect(updateTransaction).toHaveBeenCalledWith("tx1", {
      amount: "175",
      description: null,
    });
    expect(presenter.model.editSheet).toBeNull();
    expect(getTransactions).toHaveBeenCalledTimes(2);
  });

  it("does not open edit for transfers", async () => {
    const gateway = new FakeWalletGateway();
    vi.spyOn(gateway, "getAccounts").mockResolvedValue([account()]);
    vi.spyOn(gateway, "getStatsSummary").mockResolvedValue(stats());
    vi.spyOn(gateway, "getTransactions").mockResolvedValue({
      transactions: [Transaction.from(transactionDto({ type: "transfer" }))],
      total: 1,
    });
    const core = new Core({
      httpClient: {} as never,
      loggingSink: { debug: vi.fn(), error: vi.fn() },
    }).use(new WalletModule(gateway));
    const presenter = new DashboardPresenter(vi.fn(), core);
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.openEdit("tx1");

    expect(presenter.model.editSheet).toBeNull();
  });
});
