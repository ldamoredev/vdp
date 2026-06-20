import type { Currency } from "@vdp/shared";

/**
 * Universal, app-wide presentation currency for monetary AGGREGATES (summaries,
 * stats, trends). Accounts and individual transactions keep their own currency;
 * only normalized totals are reshaped to this one.
 *
 * Lives in `lib/` (framework-agnostic, no React, no `core/`) so any presenter
 * can read it, write it and subscribe to changes. The value is persisted to
 * localStorage so it survives reloads and stays consistent across screens.
 */

const STORAGE_KEY = "wallet-presentation-currency";

export const DEFAULT_PRESENTATION_CURRENCY: Currency = "ARS";

const VALID_CURRENCIES: readonly Currency[] = ["ARS", "USD"];

type Listener = () => void;

const listeners = new Set<Listener>();

function isValid(value: unknown): value is Currency {
  return typeof value === "string" && VALID_CURRENCIES.includes(value as Currency);
}

function readStored(): Currency {
  if (typeof window === "undefined") return DEFAULT_PRESENTATION_CURRENCY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isValid(raw) ? raw : DEFAULT_PRESENTATION_CURRENCY;
  } catch {
    return DEFAULT_PRESENTATION_CURRENCY;
  }
}

// In-memory source of truth, seeded from storage so subscribers stay in sync
// even where localStorage is unavailable (SSR/tests in the node environment).
let current: Currency = readStored();

export function getPresentationCurrency(): Currency {
  return current;
}

export function setPresentationCurrency(currency: Currency): void {
  if (!isValid(currency) || currency === current) return;
  current = currency;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // Ignore storage write failures (private mode, quota): the in-memory
      // value still drives the current session.
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribePresentationCurrency(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test-only: reset the in-memory value to what storage currently holds. */
export function __resetPresentationCurrencyForTests(): void {
  current = readStored();
}
