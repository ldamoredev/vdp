import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MetricValue } from "../metric-value";
import { StateCard } from "../state-card";
import { StatTile } from "../stat-tile";

describe("data primitives", () => {
  it("renders metric values as mono tabular readouts with semantic token tones", () => {
    const markup = renderToStaticMarkup(
      createElement(MetricValue, {
        tone: "income",
        size: 24,
        weight: 700,
        children: "$ 1.250,00",
      }),
    );

    expect(markup).toContain("font-data");
    expect(markup).toContain("tabular-nums");
    expect(markup).toContain("text-[var(--accent-green)]");
    expect(markup).toContain("font-size:24px");
    expect(markup).toContain("font-weight:700");
    expect(markup).toContain("$ 1.250,00");
  });

  it("renders stat tiles with an eyebrow, mono value and optional progress", () => {
    const markup = renderToStaticMarkup(
      createElement(
        StatTile,
        {
          label: "Cumplimiento",
          value: "72",
          unit: "%",
          sub: "8/12 cerradas",
          tone: "accent",
          progressValue: 72,
        },
      ),
    );

    expect(markup).toContain("Cumplimiento");
    expect(markup).toContain("uppercase");
    expect(markup).toContain("tracking-[var(--tracking-eyebrow)]");
    expect(markup).toContain("font-data");
    expect(markup).toContain("72");
    expect(markup).toContain("8/12 cerradas");
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="72"');
  });

  it("keeps emphasized stat tiles on soft token surfaces", () => {
    const markup = renderToStaticMarkup(
      createElement(StatTile, {
        label: "Presión",
        value: "3",
        tone: "amber",
        emphasis: true,
        sub: "2 bloqueadas, 1 alta prioridad",
      }),
    );

    expect(markup).toContain("bg-[var(--amber-soft-bg)]");
    expect(markup).toContain("border-[var(--amber-soft-border)]");
    expect(markup).toContain("text-[var(--amber-soft-text)]");
  });
});

describe("StateCard", () => {
  it("renders calm empty states with a dashed token border", () => {
    const markup = renderToStaticMarkup(
      createElement(StateCard, {
        title: "Todo al día",
        description: "No quedan pendientes para hoy. Si surge algo, podés capturarlo abajo.",
      }),
    );

    expect(markup).toContain("border-dashed");
    expect(markup).toContain("Todo al día");
    expect(markup).toContain("podés capturarlo abajo");
  });

  it("renders loading skeletons without exposing loading copy", () => {
    const markup = renderToStaticMarkup(
      createElement(StateCard, {
        state: "loading",
        title: "Cargando cuentas",
        description: "Cargando cuentas",
        skeletonLines: 3,
        "aria-label": "Cargando cuentas",
        children: createElement("button", null, "Reintentar"),
      }),
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Cargando cuentas"');
    expect(markup.match(/skeleton/g)?.length).toBe(3);
    expect(markup).not.toContain("Cargando cuentas</");
    expect(markup).not.toContain("Reintentar");
  });

  it("renders error states with semantic token treatment", () => {
    const markup = renderToStaticMarkup(
      createElement(StateCard, {
        state: "error",
        title: "No pudimos cargar esto",
        description: "Probá de nuevo en un rato.",
      }),
    );

    expect(markup).toContain("border-[var(--red-soft-border)]");
    expect(markup).toContain("bg-[var(--red-soft-bg)]");
    expect(markup).toContain("No pudimos cargar esto");
  });
});
