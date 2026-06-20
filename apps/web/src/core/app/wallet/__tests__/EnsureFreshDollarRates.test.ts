import type { ExchangeRate } from "@vdp/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Core } from "../../../Core";
import { EnsureFreshDollarRates } from "../EnsureFreshDollarRates";
import { WalletModule } from "../WalletModule";
import { FakeWalletGateway } from "./fakes/FakeWalletGateway";

function coreWith(gateway: FakeWalletGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
}

function mepRate(date: string): ExchangeRate {
  return { id: `mep-${date}`, fromCurrency: "USD", toCurrency: "ARS", rate: "1250", type: "mep", date };
}

describe("EnsureFreshDollarRates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 20, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes and reports true when today's MEP rate is missing", async () => {
    const gateway = new FakeWalletGateway();
    vi.spyOn(gateway, "getExchangeRates").mockResolvedValue([mepRate("2026-06-19")]);
    const refresh = vi.spyOn(gateway, "refreshExchangeRates");

    const refreshed = await coreWith(gateway).execute(new EnsureFreshDollarRates());

    expect(refreshed).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("is a no-op and reports false when today's MEP rate is already present", async () => {
    const gateway = new FakeWalletGateway();
    vi.spyOn(gateway, "getExchangeRates").mockResolvedValue([mepRate("2026-06-20")]);
    const refresh = vi.spyOn(gateway, "refreshExchangeRates");

    const refreshed = await coreWith(gateway).execute(new EnsureFreshDollarRates());

    expect(refreshed).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });
});
