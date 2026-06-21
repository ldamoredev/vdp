import type { Account, Transaction as TransactionDto, WalletStatsSummary } from "@vdp/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { Transaction } from "@/core/domain/wallet/Transaction";
import { getTodayISO } from "@/lib/format";
import {
  __resetPresentationCurrencyForTests,
  getPresentationCurrency,
  setPresentationCurrency,
} from "@/lib/preferences/presentation-currency";
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
    currency: "ARS",
    totalIncome: "1000",
    totalExpenses: "150",
    netBalance: "850",
    transactionCount: 1,
    conversion: { rateType: "mep", rates: [] },
    ...overrides,
  };
}

function build() {
  const gateway = new FakeWalletGateway();
  vi.spyOn(gateway, "getAccounts").mockResolvedValue([account()]);
  const getStatsSummary = vi.spyOn(gateway, "getStatsSummary").mockResolvedValue(stats());
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
  return { presenter, gateway, getStatsSummary, getTransactions };
}

async function flush() {
  for (let i = 0; i < 50; i += 1) await Promise.resolve();
}

describe("DashboardPresenter", () => {
  beforeEach(() => {
    __resetPresentationCurrencyForTests();
  });

  it("loads accounts, stats and recent transactions", async () => {
    const { presenter, getStatsSummary, getTransactions } = build();

    presenter.start();
    await flush();

    expect(getStatsSummary).toHaveBeenLastCalledWith({ currency: "ARS" });
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

  it("reloads the operational summary in the selected presentation currency", async () => {
    const { presenter, getStatsSummary } = build();

    presenter.start();
    await flush();

    expect(presenter.model.presentationCurrency).toBe("ARS");
    expect(presenter.model.currencyOptions).toEqual([
      { currency: "ARS", label: "ARS", selected: true },
      { currency: "USD", label: "USD", selected: false },
    ]);

    getStatsSummary.mockResolvedValue(stats({ currency: "USD" }));
    presenter.setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.presentationCurrency).toBe("USD");
    expect(presenter.model.currencyOptions).toEqual([
      { currency: "ARS", label: "ARS", selected: false },
      { currency: "USD", label: "USD", selected: true },
    ]);
    expect(getStatsSummary).toHaveBeenLastCalledWith({ currency: "USD" });
  });

  it("reads the persisted presentation currency on start", async () => {
    setPresentationCurrency("USD");
    const { presenter, getStatsSummary } = build();

    presenter.start();
    await flush();

    expect(presenter.model.presentationCurrency).toBe("USD");
    expect(getStatsSummary).toHaveBeenLastCalledWith({ currency: "USD" });
  });

  it("writes the chosen currency to the universal preference", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    presenter.setPresentationCurrency("USD");
    await flush();

    expect(getPresentationCurrency()).toBe("USD");
  });

  it("reacts to a currency change made from another screen", async () => {
    const { presenter, getStatsSummary } = build();
    presenter.start();
    await flush();

    getStatsSummary.mockResolvedValue(stats({ currency: "USD" }));
    setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.presentationCurrency).toBe("USD");
    expect(getStatsSummary).toHaveBeenLastCalledWith({ currency: "USD" });
  });

  it("shows the converted numbers, not the previous currency values", async () => {
    const { presenter, getStatsSummary } = build();
    presenter.start();
    await flush();

    expect(presenter.model.stats.map((item) => item.valueLabel)).toEqual([
      "+$ 1.000,00",
      "-$ 150,00",
      "$ 850,00",
    ]);

    getStatsSummary.mockResolvedValue(
      stats({ currency: "USD", totalIncome: "1", totalExpenses: "0.15", netBalance: "0.85" }),
    );
    presenter.setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.stats.map((item) => item.valueLabel)).toEqual([
      "+US$ 1,00",
      "-US$ 0,15",
      "US$ 0,85",
    ]);
  });

  it("surfaces an error instead of stale numbers when the conversion fails", async () => {
    const { presenter, getStatsSummary } = build();
    presenter.start();
    await flush();

    getStatsSummary.mockRejectedValue(new Error("Missing mep exchange rate"));
    presenter.setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.statsError).toBe(true);
    expect(presenter.model.stats.map((item) => item.valueLabel)).not.toEqual([
      "+$ 1.000,00",
      "-$ 150,00",
      "$ 850,00",
    ]);
  });

  it("refreshes a stale MEP rate on start and reloads the summary", async () => {
    const { presenter, gateway, getStatsSummary } = build();
    vi.spyOn(gateway, "getExchangeRates").mockResolvedValue([]);
    const refresh = vi.spyOn(gateway, "refreshExchangeRates");

    presenter.start();
    await flush();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getStatsSummary.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("does not refresh when today's MEP rate is already present", async () => {
    const { presenter, gateway } = build();
    vi.spyOn(gateway, "getExchangeRates").mockResolvedValue([
      { id: "mep", fromCurrency: "USD", toCurrency: "ARS", rate: "1000", type: "mep", date: getTodayISO() },
    ]);
    const refresh = vi.spyOn(gateway, "refreshExchangeRates");

    presenter.start();
    await flush();

    expect(refresh).not.toHaveBeenCalled();
  });

  it("materializes due recurring rules on load, before reading transactions", async () => {
    const { presenter, gateway, getTransactions } = build();
    const materialize = vi.spyOn(gateway, "materializeDueRecurringTransactions");

    presenter.start();
    await flush();

    expect(materialize).toHaveBeenCalledTimes(1);
    expect(materialize.mock.invocationCallOrder[0]).toBeLessThan(getTransactions.mock.invocationCallOrder[0]);
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
