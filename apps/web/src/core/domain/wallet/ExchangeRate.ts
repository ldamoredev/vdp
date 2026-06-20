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

/** The rate type used to normalize aggregates to the presentation currency. */
export const PRESENTATION_RATE_TYPE = "mep";

/**
 * Whether the USD→ARS rate used for presentation-currency conversion is missing
 * or older than `today`. Drives the lazy refresh: when stale, the app pulls a
 * fresh quote before showing converted aggregates.
 */
export function isDollarRateStale(
  rates: readonly ExchangeRate[],
  today: string,
  type: string = PRESENTATION_RATE_TYPE,
): boolean {
  const latestDate = rates
    .filter((rate) => rate.fromCurrency === "USD" && rate.toCurrency === "ARS" && rate.type === type)
    .map((rate) => rate.date)
    .sort()
    .at(-1);
  return latestDate === undefined || latestDate < today;
}
