import type { ExchangeRate as ExchangeRateDto, ExchangeRateType } from "@vdp/shared";

/**
 * A currency exchange rate. Plain data (reuses the wire shape).
 */
export type ExchangeRate = ExchangeRateDto;
export type { ExchangeRateType };

/** The latest USD→ARS rates, ordered by type so the strip renders deterministically. */
export function latestDollarRates(rates: readonly ExchangeRate[]): ExchangeRate[] {
  return rates
    .filter((rate) => rate.fromCurrency === "USD" && rate.toCurrency === "ARS")
    .sort((a, b) => a.type.localeCompare(b.type));
}
