import { Command, RequestHandler } from "@nbottarini/cqbus";

import { isDollarRateStale } from "../../domain/wallet/ExchangeRate";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";
import { getTodayISO } from "@/lib/format";

/**
 * Lazy, staleness-guarded refresh of the presentation-currency (MEP) rate.
 * Returns `true` when it actually pulled a fresh quote, so callers can reload
 * their converted aggregates. A no-op when today's rate is already present.
 */
export class EnsureFreshDollarRates extends Command<boolean> {}

export class EnsureFreshDollarRatesHandler implements RequestHandler<EnsureFreshDollarRates, boolean> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<boolean> {
    const rates = await this.gateway.getExchangeRates();
    if (!isDollarRateStale(rates, getTodayISO())) return false;
    await this.gateway.refreshExchangeRates();
    return true;
  }
}
