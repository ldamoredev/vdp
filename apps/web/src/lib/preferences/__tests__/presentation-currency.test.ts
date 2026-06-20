// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_PRESENTATION_CURRENCY,
  __resetPresentationCurrencyForTests,
  getPresentationCurrency,
  setPresentationCurrency,
  subscribePresentationCurrency,
} from "../presentation-currency";

describe("presentation currency preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetPresentationCurrencyForTests();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to ARS when nothing is stored", () => {
    expect(getPresentationCurrency()).toBe(DEFAULT_PRESENTATION_CURRENCY);
    expect(DEFAULT_PRESENTATION_CURRENCY).toBe("ARS");
  });

  it("persists the chosen currency to localStorage", () => {
    setPresentationCurrency("USD");

    expect(getPresentationCurrency()).toBe("USD");
    expect(window.localStorage.getItem("wallet-presentation-currency")).toBe("USD");
  });

  it("recovers the persisted currency on a fresh read (simulated reload)", () => {
    window.localStorage.setItem("wallet-presentation-currency", "USD");

    __resetPresentationCurrencyForTests();

    expect(getPresentationCurrency()).toBe("USD");
  });

  it("ignores invalid stored values and falls back to the default", () => {
    window.localStorage.setItem("wallet-presentation-currency", "BTC");

    __resetPresentationCurrencyForTests();

    expect(getPresentationCurrency()).toBe("ARS");
  });

  it("notifies subscribers when the currency changes", () => {
    const listener = vi.fn();
    subscribePresentationCurrency(listener);

    setPresentationCurrency("USD");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify when the currency is unchanged", () => {
    setPresentationCurrency("USD");
    const listener = vi.fn();
    subscribePresentationCurrency(listener);

    setPresentationCurrency("USD");

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePresentationCurrency(listener);

    unsubscribe();
    setPresentationCurrency("USD");

    expect(listener).not.toHaveBeenCalled();
  });
});
