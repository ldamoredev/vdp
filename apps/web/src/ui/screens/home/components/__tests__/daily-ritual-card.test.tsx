import React, { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  useNavigate: () => () => {},
  useLocation: () => ({ pathname: "/" }),
  useSearchParams: () => [new URLSearchParams(), () => {}],
}));

import { DailyRitualCard } from "../daily-ritual-card";

const emptyProjectHours = {
  title: "Tiempo de proyectos hoy",
  summary: "Todavía no cargaste horas de proyecto para hoy.",
  totalLabel: "0m",
  emptyLabel: "Sin horas registradas hoy.",
  hasEntries: false,
  rows: [],
};

beforeEach(() => {
  globalThis.React = React;
});

describe("DailyRitualCard", () => {
  it("renders a resume CTA when a review is already in progress", () => {
    const markup = renderToStaticMarkup(
      createElement(DailyRitualCard, {
        model: {
          morning: {
            statusLabel: "Elegí foco",
            summary: "Sin arrastre de ayer. Elegí una tarea para proteger como foco del día.",
            projectHours: emptyProjectHours,
            carryOverTasks: [],
            carryOverCountLabel: "0 pendientes",
            canConfirmCarryOvers: false,
            isConfirmingCarryOvers: false,
            focusOptions: [{
              id: "focus-1",
              title: "Enviar propuesta",
              detail: "Alta",
              selected: false,
            }],
            focusTaskTitle: null,
            plannedAtLabel: null,
            isSavingFocus: false,
            error: null,
          },
          statusLabel: "2 de 4 bloques resueltos",
          href: "/review",
          ctaLabel: "Retomar ritual",
          taskCount: 2,
          walletCount: 1,
          insightCount: 1,
        },
        onConfirmCarryOvers: () => {},
        onChooseFocus: () => {},
      }),
    );

    expect(markup).toContain("Retomar ritual");
    expect(markup).toContain("Plan del día");
    expect(markup).toContain("Enviar propuesta");
    expect(markup).toContain("/review");
    expect(markup).toContain("sm:flex-row");
    // CTA stretches full-width on mobile and shrinks to auto on larger screens.
    expect(markup).toContain("w-full");
    expect(markup).toContain("sm:w-auto");
  });
});
