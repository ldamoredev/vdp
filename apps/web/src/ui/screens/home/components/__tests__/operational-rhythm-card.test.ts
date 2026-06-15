import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HomeRhythmViewModel } from "@/ui/models/home/HomeViewModel";
import { OperationalRhythmCard } from "../operational-rhythm-card";

function rhythm(overrides: Partial<HomeRhythmViewModel> = {}): HomeRhythmViewModel {
  return {
    periodLabel: "últimos 7 días",
    rateLabel: "25%",
    tone: "watch",
    message: "Arrastre moderado: 3 de 12 tareas se patearon. Vigilalo.",
    domains: [
      { id: "work", label: "work", countLabel: "8 completadas" },
      { id: "finanzas", label: "finanzas", countLabel: "2 completadas" },
    ],
    ...overrides,
  };
}

describe("OperationalRhythmCard", () => {
  it("renders the rate and the top domains by volume", () => {
    const markup = renderToStaticMarkup(
      createElement(OperationalRhythmCard, { rhythm: rhythm() }),
    );

    expect(markup).toContain("25%");
    expect(markup).toContain("últimos 7 días");
    expect(markup).toContain("work");
    expect(markup).toContain("8 completadas");
  });

  it("renders a placeholder while data loads", () => {
    const markup = renderToStaticMarkup(
      createElement(OperationalRhythmCard, {
        rhythm: rhythm({
          rateLabel: "—",
          tone: "ok",
          message: "Sin datos suficientes todavía — cargá y cerrá tareas unos días.",
          domains: [],
        }),
      }),
    );

    expect(markup).toContain("—");
  });
});
