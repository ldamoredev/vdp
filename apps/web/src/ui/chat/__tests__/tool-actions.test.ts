import { describe, expect, it } from "vitest";
import { getToolDisplayName, parseToolAction } from "../tool-actions";
import { domains } from "@/lib/navigation";

describe("getToolDisplayName", () => {
  it("keeps wallet shell copy aligned with the product tone", () => {
    const walletDomain = domains.find((domain) => domain.key === "wallet");

    expect(walletDomain).toMatchObject({
      chatPlaceholder: "Registra un gasto o revisa un numero...",
      chatWelcome: "Hola! Soy tu asistente de Wallet",
    });
  });

  it("returns friendly product labels for wallet tools", () => {
    expect(getToolDisplayName("get_accounts")).toBe("Ver cuentas");
    expect(getToolDisplayName("create_account")).toBe("Crear cuenta");
    expect(getToolDisplayName("list_transactions")).toBe("Ver movimientos");
    expect(getToolDisplayName("log_transaction")).toBe("Registrar movimiento");
    expect(getToolDisplayName("get_balance")).toBe("Ver balance");
    expect(getToolDisplayName("spending_summary")).toBe("Resumen de gastos");
    expect(getToolDisplayName("list_savings_goals")).toBe("Ver ahorros");
    expect(getToolDisplayName("create_savings_goal")).toBe(
      "Crear objetivo de ahorro",
    );
    expect(getToolDisplayName("update_savings_goal")).toBe(
      "Actualizar objetivo de ahorro",
    );
    expect(getToolDisplayName("contribute_savings")).toBe("Aportar a ahorros");
    expect(getToolDisplayName("list_investments")).toBe("Ver inversiones");
    expect(getToolDisplayName("create_investment")).toBe("Crear inversion");
    expect(getToolDisplayName("update_investment")).toBe(
      "Actualizar inversion",
    );
    expect(getToolDisplayName("get_exchange_rates")).toBe("Ver cotizaciones");
    expect(getToolDisplayName("create_exchange_rate")).toBe(
      "Registrar cotizacion",
    );
  });
});

describe("parseToolAction", () => {
  it("builds a success summary for logged wallet transactions", () => {
    const view = parseToolAction(
      "log_transaction",
      JSON.stringify({
        description: "Supermercado",
        amount: "23000.50",
        currency: "ARS",
        date: "2026-04-05",
      }),
    );

    expect(view).toEqual({
      title: "Movimiento registrado: Supermercado",
      detail: "23000.50 ARS · 2026-04-05",
      tone: "success",
    });
  });

  it("builds an info summary for spending totals", () => {
    const view = parseToolAction(
      "spending_summary",
      JSON.stringify({
        totalIncome: "81000.00",
        totalExpenses: "54000.00",
        netBalance: "27000.00",
        transactionCount: 12,
      }),
    );

    expect(view).toEqual({
      title: "Resumen de gastos",
      detail:
        "54000.00 gastos · 81000.00 ingresos · balance neto 27000.00 · 12 movimientos",
      tone: "info",
    });
  });

  it("keeps existing task tool summaries working", () => {
    const view = parseToolAction(
      "create_task",
      JSON.stringify({
        title: "Preparar reporte",
        scheduledDate: "2026-04-06",
        priority: 2,
      }),
    );

    expect(view).toEqual({
      title: "Tarea creada: Preparar reporte",
      detail: "Programada para 2026-04-06 · Prioridad: Media",
      tone: "success",
    });
  });

  it("offers a direct ritual CTA for the day review tool", () => {
    const action = parseToolAction(
      "get_end_of_day_review",
      JSON.stringify({ completed: 3, pending: 2, completionRate: 60 }),
    );

    expect(action).toMatchObject({
      title: "Review del dia",
      ctaLabel: "Abrir ritual diario",
      ctaHref: "/review",
    });
  });
});
