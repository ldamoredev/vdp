import type { CategoryStat, ExchangeRate, MonthlyTrend } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
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
  return { presenter };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
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
      monthlyTrend: [{ month: "2026-05", income: 100, expense: 40 }],
    });

    presenter.start();
    await flush();

    expect(presenter.model.monthlyTrend.bars[0]).toMatchObject({ income: 100, expense: 40 });
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
        { categoryId: "c1", categoryName: "Comida", total: 300, count: 2 },
        { categoryId: null, categoryName: "Sin categoria", total: 100, count: 1 },
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
});
