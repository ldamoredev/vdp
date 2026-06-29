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
        periodLabel: "ene 2026 - dic 2026",
        sourceLabel: "Manual",
        currentValueLabel: "3 libros",
        targetValueLabel: "12 libros",
        progressPercent: 25,
        progressLabel: "25%",
        isCreatingTask: false,
      },
    ],
    ...overrides,
  };
}

describe("ObjectivesNorthCard", () => {
  it("renders active objectives and links to Metas", () => {
    const markup = renderToStaticMarkup(
      createElement(ObjectivesNorthCard, { model: objectives(), onCreateTask: vi.fn() }),
    );

    expect(markup).toContain("Metas");
    expect(markup).toContain('href="/objectives"');
    expect(markup).toContain("Leer 12 libros");
    expect(markup).toContain("25%");
    expect(markup).toContain("3 libros");
    expect(markup).toContain("12 libros");
    expect(markup).toContain("Crear tarea para hoy");
  });

  it("renders an empty state when there are no active objectives", () => {
    const markup = renderToStaticMarkup(
      createElement(ObjectivesNorthCard, {
        model: objectives({ countLabel: "0 activas", items: [] }),
        onCreateTask: vi.fn(),
      }),
    );

    expect(markup).toContain("No hay metas activas.");
  });
});
