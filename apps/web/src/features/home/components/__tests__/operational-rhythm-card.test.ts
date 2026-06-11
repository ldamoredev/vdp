import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildRhythmSummary,
  OperationalRhythmCard,
} from "../operational-rhythm-card";

describe("buildRhythmSummary", () => {
  it("reports missing data when there are no tasks in the window", () => {
    expect(buildRhythmSummary(undefined).tone).toBe("ok");
    expect(
      buildRhythmSummary({ total: 0, carriedOver: 0, rate: 0, days: 7 }).message,
    ).toContain("Sin datos suficientes");
  });

  it("flags high carry-over as alert above 40%", () => {
    const summary = buildRhythmSummary({ total: 10, carriedOver: 5, rate: 50, days: 7 });
    expect(summary.tone).toBe("alert");
    expect(summary.message).toContain("5 de 10");
  });

  it("flags moderate carry-over between 20% and 40%", () => {
    expect(buildRhythmSummary({ total: 10, carriedOver: 3, rate: 30, days: 7 }).tone).toBe("watch");
  });

  it("treats low carry-over as healthy", () => {
    expect(buildRhythmSummary({ total: 10, carriedOver: 1, rate: 10, days: 7 }).tone).toBe("ok");
  });
});

describe("OperationalRhythmCard", () => {
  it("renders the rate and the top domains by volume", () => {
    const markup = renderToStaticMarkup(
      createElement(OperationalRhythmCard, {
        carryOver: { total: 12, carriedOver: 3, rate: 25, days: 7 },
        byDomain: [
          { domain: "work", total: 8, completed: 6, rate: 75 },
          { domain: "finanzas", total: 2, completed: 2, rate: 100 },
          { domain: "health", total: 0, completed: 0, rate: 0 },
        ],
      }),
    );

    expect(markup).toContain("25%");
    expect(markup).toContain("últimos 7 días");
    expect(markup).toContain("work");
    expect(markup).toContain("6/8");
    // Zero-volume domains stay out of the list.
    expect(markup).not.toContain("health");
  });

  it("renders a placeholder while data loads", () => {
    const markup = renderToStaticMarkup(createElement(OperationalRhythmCard, {}));
    expect(markup).toContain("—");
  });
});
