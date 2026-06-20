import { describe, expect, it } from "vitest";

import { type ExchangeRate, isDollarRateStale, latestDollarRates } from "../ExchangeRate";

function rate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return {
    id: "r1",
    fromCurrency: "USD",
    toCurrency: "ARS",
    rate: "1000",
    type: "mep",
    date: "2026-06-20",
    ...overrides,
  };
}

describe("isDollarRateStale", () => {
  const today = "2026-06-20";

  it("is stale when there is no MEP rate at all", () => {
    expect(isDollarRateStale([rate({ type: "blue" })], today)).toBe(true);
  });

  it("is stale when the latest MEP rate is from a previous day", () => {
    expect(isDollarRateStale([rate({ date: "2026-06-19" })], today)).toBe(true);
  });

  it("is fresh when a MEP rate is dated today", () => {
    expect(isDollarRateStale([rate({ date: today })], today)).toBe(false);
  });

  it("uses the most recent MEP rate to decide", () => {
    expect(
      isDollarRateStale([rate({ id: "old", date: "2026-06-18" }), rate({ id: "new", date: today })], today),
    ).toBe(false);
  });

  it("ignores non USD->ARS rates", () => {
    expect(isDollarRateStale([rate({ fromCurrency: "ARS", toCurrency: "USD", date: today })], today)).toBe(true);
  });
});

describe("latestDollarRates", () => {
  it("keeps only USD->ARS rates ordered by type", () => {
    const result = latestDollarRates([
      rate({ id: "mep", type: "mep" }),
      rate({ id: "ars", fromCurrency: "ARS", toCurrency: "USD" }),
      rate({ id: "blue", type: "blue" }),
    ]);
    expect(result.map((r) => r.id)).toEqual(["blue", "mep"]);
  });
});
