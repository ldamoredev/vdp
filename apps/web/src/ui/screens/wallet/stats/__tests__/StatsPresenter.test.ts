import type { CategoryStat, ExchangeRate, MonthlyTrend } from "@vdp/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { formatMoney, getTodayISO } from "@/lib/format";
import {
  __resetPresentationCurrencyForTests,
  getPresentationCurrency,
  setPresentationCurrency,
} from "@/lib/preferences/presentation-currency";
import { StatsPresenter } from "../StatsPresenter";

function build({
  byCategory = [] as CategoryStat[],
  monthlyTrend = [] as MonthlyTrend[],
  rates = [] as ExchangeRate[],
} = {}) {
  const gateway = new FakeWalletGateway();
  vi.spyOn(gateway, "getStatsByCategory").mockResolvedValue(byCategory);
  vi.spyOn(gateway, "getMonthlyTrend").mockResolvedValue(monthlyTrend);
  vi.spyOn(gateway, "getExchangeRates").mockResolvedValue(rates);
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
  const presenter = new StatsPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway };
}

async function flush() {
  for (let i = 0; i < 50; i += 1) await Promise.resolve();
}

function rate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    id: "r1",
    fromCurrency: "USD",
    toCurrency: "ARS",
    rate: "1000",
    type: "blue",
    date: "2026-06-14",
    ...overrides,
  };
}

describe("StatsPresenter", () => {
  beforeEach(() => {
    __resetPresentationCurrencyForTests();
  });

  it("marks each panel empty when there is no data", async () => {
    const { presenter } = build();

    presenter.start();
    await flush();

    expect(presenter.model.monthlyTrend.isEmpty).toBe(true);
    expect(presenter.model.dollarRates.isEmpty).toBe(true);
    expect(presenter.model.byCategory.isEmpty).toBe(true);
  });

  it("builds month labels and trend bars", async () => {
    const { presenter } = build({
      monthlyTrend: [{ month: "2026-05", currency: "ARS", income: 100, expense: 40 }],
    });

    presenter.start();
    await flush();

    expect(presenter.model.monthlyTrend.bars[0]).toMatchObject({ currency: "ARS", income: 100, expense: 40 });
    expect(presenter.model.monthlyTrend.bars[0].label).toMatch(/may/i);
  });

  it("keeps only USD->ARS dollar rates ordered by type", async () => {
    const { presenter } = build({
      rates: [
        rate({ id: "blue", type: "blue" }),
        rate({ id: "ars-usd", fromCurrency: "ARS", toCurrency: "USD" }),
        rate({ id: "official", type: "official" }),
      ],
    });

    presenter.start();
    await flush();

    expect(presenter.model.dollarRates.items.map((r) => r.id)).toEqual(["blue", "official"]);
  });

  it("builds category slices with colors, sanity totals and deep-links", async () => {
    const { presenter } = build({
      byCategory: [
        { categoryId: "c1", categoryName: "Comida", currency: "ARS", total: 300, count: 2 },
        { categoryId: null, categoryName: "Sin categoria", currency: "ARS", total: 100, count: 1 },
      ],
    });

    presenter.start();
    await flush();

    const { byCategory } = presenter.model;
    expect(byCategory.sanity.transactionCount).toBe(3);
    expect(byCategory.slices[0].href).toBe("/wallet/transactions?type=expense&categoryId=c1");
    expect(byCategory.slices[0].color).toBeTruthy();
    expect(byCategory.slices[1].href).toBeNull();
  });

  it("formats category slices and the sanity total with each row currency", async () => {
    const { presenter } = build({
      byCategory: [
        { categoryId: "c1", categoryName: "Comida", currency: "ARS", total: 1000, count: 1 },
        { categoryId: "c1", categoryName: "Comida", currency: "USD", total: 100, count: 1 },
      ],
    });

    presenter.start();
    await flush();

    const { byCategory } = presenter.model;
    expect(byCategory.sanity.totalLabel).toContain(formatMoney(1000, "ARS"));
    expect(byCategory.sanity.totalLabel).toContain(formatMoney(100, "USD"));
    expect(byCategory.slices.map((slice) => slice.totalLabel)).toEqual([
      formatMoney(1000, "ARS"),
      formatMoney(100, "USD"),
    ]);
  });

  it("loads finance aggregates in the selected presentation currency", async () => {
    const { presenter, gateway } = build();

    presenter.start();
    await flush();

    expect(presenter.model.presentationCurrency).toBe("ARS");
    expect(gateway.getStatsByCategory).toHaveBeenLastCalledWith({ currency: "ARS" });
    expect(gateway.getMonthlyTrend).toHaveBeenLastCalledWith({ currency: "ARS" });

    presenter.setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.presentationCurrency).toBe("USD");
    expect(presenter.model.currencyOptions).toEqual([
      { currency: "ARS", label: "ARS", selected: false },
      { currency: "USD", label: "USD", selected: true },
    ]);
    expect(gateway.getStatsByCategory).toHaveBeenLastCalledWith({ currency: "USD" });
    expect(gateway.getMonthlyTrend).toHaveBeenLastCalledWith({ currency: "USD" });
  });

  it("reads the persisted presentation currency on start", async () => {
    setPresentationCurrency("USD");
    const { presenter, gateway } = build();

    presenter.start();
    await flush();

    expect(presenter.model.presentationCurrency).toBe("USD");
    expect(gateway.getStatsByCategory).toHaveBeenLastCalledWith({ currency: "USD" });
    expect(gateway.getMonthlyTrend).toHaveBeenLastCalledWith({ currency: "USD" });
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
    const { presenter, gateway } = build();
    presenter.start();
    await flush();

    setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.presentationCurrency).toBe("USD");
    expect(gateway.getStatsByCategory).toHaveBeenLastCalledWith({ currency: "USD" });
    expect(gateway.getMonthlyTrend).toHaveBeenLastCalledWith({ currency: "USD" });
  });

  it("reflects the converted aggregates instead of the previous currency values", async () => {
    const { presenter, gateway } = build({
      monthlyTrend: [{ month: "2026-05", currency: "ARS", income: 1000, expense: 400 }],
    });
    presenter.start();
    await flush();

    expect(presenter.model.monthlyTrend.bars[0]).toMatchObject({
      currency: "ARS",
      income: 1000,
      expense: 400,
    });

    vi.mocked(gateway.getMonthlyTrend).mockResolvedValue([
      { month: "2026-05", currency: "USD", income: 1, expense: 0.4 },
    ]);
    presenter.setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.monthlyTrend.bars[0]).toMatchObject({
      currency: "USD",
      income: 1,
      expense: 0.4,
    });
  });

  it("refreshes a stale MEP rate on start and reloads the aggregates", async () => {
    const { presenter, gateway } = build();
    vi.mocked(gateway.getExchangeRates).mockResolvedValue([]);
    const refresh = vi.spyOn(gateway, "refreshExchangeRates");

    presenter.start();
    await flush();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(vi.mocked(gateway.getStatsByCategory).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("does not refresh when today's MEP rate is already present", async () => {
    const { presenter, gateway } = build();
    vi.mocked(gateway.getExchangeRates).mockResolvedValue([
      { id: "mep", fromCurrency: "USD", toCurrency: "ARS", rate: "1000", type: "mep", date: getTodayISO() },
    ]);
    const refresh = vi.spyOn(gateway, "refreshExchangeRates");

    presenter.start();
    await flush();

    expect(refresh).not.toHaveBeenCalled();
  });

  it("surfaces an error instead of stale aggregates when the conversion fails", async () => {
    const { presenter, gateway } = build({
      byCategory: [{ categoryId: "c1", categoryName: "Comida", currency: "ARS", total: 300, count: 2 }],
    });
    presenter.start();
    await flush();

    vi.mocked(gateway.getStatsByCategory).mockRejectedValue(new Error("Missing mep exchange rate"));
    vi.mocked(gateway.getMonthlyTrend).mockRejectedValue(new Error("Missing mep exchange rate"));
    presenter.setPresentationCurrency("USD");
    await flush();

    expect(presenter.model.error).toBe(true);
    expect(presenter.model.byCategory.slices).toHaveLength(0);
  });
});
