import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { HomeObjectivesViewModel } from "@/ui/models/home/HomeViewModel";
import { ObjectivesNorthCard } from "../objectives-north-card";

vi.mock("react-router", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: ReactNode;
    className?: string;
  }) => createElement("a", { href: to, className }, children),
}));

function objectives(overrides: Partial<HomeObjectivesViewModel> = {}): HomeObjectivesViewModel {
  return {
    href: "/objectives",
    countLabel: "1 activa",
    items: [
      {
        id: "o1",
        title: "Leer 12 libros",
        sourceLabel: "Manual",
        daysRemainingLabel: "Quedan 30 días",
        currentValueLabel: "3 libros",
        targetValueLabel: "12 libros",
        progressPercent: 25,
        progressLabel: "25%",
        createTaskHref: `/tasks?capturar=${encodeURIComponent("Avanzar en: Leer 12 libros")}`,
      },
    ],
    ...overrides,
  };
}

describe("ObjectivesNorthCard", () => {
  it("renders active objectives, days remaining and a capturar deep-link to Tasks", () => {
    const markup = renderToStaticMarkup(
      createElement(ObjectivesNorthCard, { model: objectives() }),
    );

    expect(markup).toContain("Metas");
    expect(markup).toContain('href="/objectives"');
    expect(markup).toContain("Leer 12 libros");
    expect(markup).toContain("Manual");
    expect(markup).toContain("Quedan 30 días");
    expect(markup).toContain("25%");
    expect(markup).toContain("3 libros");
    expect(markup).toContain("12 libros");
    expect(markup).toContain(`href="/tasks?capturar=${encodeURIComponent("Avanzar en: Leer 12 libros")}"`);
    expect(markup).toContain("Capturar tarea");
  });

  it("renders an empty state when there are no active objectives", () => {
    const markup = renderToStaticMarkup(
      createElement(ObjectivesNorthCard, {
        model: objectives({ countLabel: "0 activas", items: [] }),
      }),
    );

    expect(markup).toContain("No hay metas activas.");
  });
});