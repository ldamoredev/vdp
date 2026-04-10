import { describe, expect, it } from "vitest";
import {
  buildWalletScreenIntro,
  buildWalletEmptyState,
  buildWalletTransactionMeta,
} from "../wallet-polish-selectors";

describe("buildWalletScreenIntro", () => {
  it("returns a denser dashboard subtitle", () => {
    expect(buildWalletScreenIntro("dashboard")).toBe(
      "Resumen operativo de tus cuentas, movimientos y señales del dia",
    );
  });
});

describe("buildWalletEmptyState", () => {
  it("returns wallet-specific empty-state copy for transactions", () => {
    expect(buildWalletEmptyState("transactions")).toEqual({
      title: "Todavía no hay movimientos",
      body: "Cuando registres ingresos o gastos, los vas a ver ordenados y listos para revisar.",
      ctaLabel: "Registrar movimiento",
      ctaHref: "/wallet/transactions/new",
    });
  });

  it("does not point account empty states back to the same screen", () => {
    expect(buildWalletEmptyState("accounts")).toEqual({
      title: "Todavía no hay cuentas",
      body: "Crea una cuenta para empezar a ordenar saldos, gastos e ingresos.",
    });
  });
});

describe("buildWalletTransactionMeta", () => {
  it("formats category and date into a compact review string", () => {
    expect(
      buildWalletTransactionMeta({
        categoryName: "Comida",
        date: "2026-04-10",
      }),
    ).toBe("Comida · 10 abr 2026");
  });
});
