import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { HomeSignalViewModel } from "@/ui/models/home/HomeViewModel";

vi.mock("react-router", () => ({
  Link: ({
    to,
    children,
  }: {
    to: string;
    children: ReactNode;
  }) => createElement("a", { href: to }, children),
  useNavigate: () => () => {},
  useLocation: () => ({ pathname: "/" }),
  useSearchParams: () => [new URLSearchParams(), () => {}],
}));

import { CrossDomainSignalsCard } from "../cross-domain-signals-card";

function signal(overrides: Partial<HomeSignalViewModel> = {}): HomeSignalViewModel {
  return {
    id: "insight-wallet",
    tone: "warning",
    typeLabel: "Alerta",
    domainLabel: "Wallet",
    title: "Gasto elevado esta semana",
    message: "Tu gasto subio 75% respecto al promedio.",
    dateLabel: "5 abr",
    periodLabel: null,
    action: {
      href: "/wallet",
      label: "Abrir Wallet",
      domainLabel: "Wallet",
    },
    ...overrides,
  };
}

describe("CrossDomainSignalsCard", () => {
  it("renders recent insights with their action links", () => {
    const markup = renderToStaticMarkup(
      createElement(CrossDomainSignalsCard, {
        insights: [
          signal(),
          signal({
            id: "insight-task",
            tone: "suggestion",
            typeLabel: "Sugerencia",
            domainLabel: "Tasks",
            title: "Tarea atascada",
            message: "Conviene dividirla en pasos mas concretos.",
            action: {
              href: "/tasks",
              label: "Ir a Tasks",
              domainLabel: "Tasks",
            },
          }),
        ],
        countLabel: "2 recientes",
      }),
    );

    expect(markup).toContain("Senales cruzadas");
    expect(markup).toContain("Gasto elevado esta semana");
    expect(markup).toContain("Abrir Wallet");
    expect(markup).toContain("/wallet");
    expect(markup).toContain("Wallet");
    expect(markup).toContain("Tarea atascada");
    expect(markup).toContain("Ir a Tasks");
  });

  it("renders the insight period window when present", () => {
    const markup = renderToStaticMarkup(
      createElement(CrossDomainSignalsCard, {
        insights: [
          signal({
            id: "insight-period-window",
            title: "Gasto elevado esta semana",
            periodLabel: "Ventana: 2026-03-30 → 2026-04-05",
            action: {
              href: "/wallet/transactions?from=2026-03-30&to=2026-04-05",
              label: "Revisar movimientos",
              domainLabel: "Wallet",
            },
          }),
        ],
        countLabel: "1 reciente",
      }),
    );

    expect(markup).toContain("Ventana: 2026-03-30 → 2026-04-05");
    expect(markup).toContain("Revisar movimientos");
  });

  it("shows an empty state when there are no recent insights", () => {
    const markup = renderToStaticMarkup(
      createElement(CrossDomainSignalsCard, { insights: [], countLabel: "0 recientes" }),
    );

    expect(markup).toContain("Todavia no hay insights recientes");
    expect(markup).not.toContain("Abrir Wallet");
  });
});
