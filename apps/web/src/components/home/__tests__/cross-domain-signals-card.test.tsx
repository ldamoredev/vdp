import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href }, children),
}));

import { CrossDomainSignalsCard } from "../cross-domain-signals-card";
import type { TaskInsight } from "@/lib/api/types";

describe("CrossDomainSignalsCard", () => {
  it("renders recent insights with their action links", () => {
    const insights: TaskInsight[] = [
      {
        id: "insight-wallet",
        type: "warning",
        title: "Gasto elevado esta semana",
        message: "Tu gasto subio 75% respecto al promedio.",
        createdAt: "2026-04-05T12:00:00.000Z",
        read: false,
        metadata: {
          source: "wallet.spending.spike",
        },
        action: {
          href: "/wallet",
          label: "Abrir Wallet",
          domain: "wallet",
        },
      },
      {
        id: "insight-task",
        type: "suggestion",
        title: "Tarea atascada",
        message: "Conviene dividirla en pasos mas concretos.",
        createdAt: "2026-04-05T10:00:00.000Z",
        read: true,
        action: {
          href: "/tasks",
          label: "Ir a Tasks",
          domain: "tasks",
        },
      },
    ];

    const markup = renderToStaticMarkup(
      createElement(CrossDomainSignalsCard, { insights }),
    );

    expect(markup).toContain("Senales cruzadas");
    expect(markup).toContain("Gasto elevado esta semana");
    expect(markup).toContain("Abrir Wallet");
    expect(markup).toContain("/wallet");
    expect(markup).toContain("Wallet");
    expect(markup).toContain("Tarea atascada");
    expect(markup).toContain("Ir a Tasks");
  });

  it("shows an empty state when there are no recent insights", () => {
    const markup = renderToStaticMarkup(
      createElement(CrossDomainSignalsCard, { insights: [] }),
    );

    expect(markup).toContain("Todavia no hay insights recientes");
    expect(markup).not.toContain("Abrir Wallet");
  });
});
