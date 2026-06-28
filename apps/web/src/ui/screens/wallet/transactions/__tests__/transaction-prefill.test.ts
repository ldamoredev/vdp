import { describe, expect, it } from "vitest";

import { parseWalletTransactionPrefill } from "../transaction-prefill";

describe("parseWalletTransactionPrefill", () => {
  it("parses the shared transaction prefill params", () => {
    const prefill = parseWalletTransactionPrefill(new URLSearchParams({
      type: "income",
      amount: "150.00",
      currency: "USD",
      description: "Ship D3d",
    }));

    expect(prefill).toEqual({
      type: "income",
      amount: "150.00",
      currency: "USD",
      description: "Ship D3d",
    });
  });

  it("maps the legacy expense suggestion alias", () => {
    const prefill = parseWalletTransactionPrefill(new URLSearchParams({
      "registrar-gasto": "Pagar el alquiler",
    }));

    expect(prefill).toEqual({
      type: "expense",
      description: "Pagar el alquiler",
    });
  });

  it("ignores invalid type and currency values", () => {
    const prefill = parseWalletTransactionPrefill(new URLSearchParams({
      type: "refund",
      amount: "10",
      currency: "EUR",
      description: "Invalid metadata",
    }));

    expect(prefill).toEqual({
      amount: "10",
      description: "Invalid metadata",
    });
  });
});
