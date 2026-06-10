import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { SanityStrip } from "../sanity-strip/sanity-strip";

beforeEach(() => {
  globalThis.React = React;
});

describe("SanityStrip", () => {
  it("renders count, total, and date range", () => {
    const markup = renderToStaticMarkup(
      createElement(SanityStrip, {
        transactionCount: 3,
        totalAmount: "$ 1.500,00",
        dateRange: {
          from: "2026-04-01",
          to: "2026-04-08",
        },
      }),
    );

    expect(markup).toContain("3 movimientos");
    expect(markup).toContain("$ 1.500,00");
    expect(markup).toContain("1 abr 2026");
    expect(markup).toContain("8 abr 2026");
  });

  it("renders an optional label without a date range", () => {
    const markup = renderToStaticMarkup(
      createElement(SanityStrip, {
        transactionCount: 8,
        totalAmount: "$ 24.000,00",
        label: "en gastos",
      }),
    );

    expect(markup).toContain("8 movimientos");
    expect(markup).toContain("$ 24.000,00 en gastos");
    expect(markup).not.toContain("—");
  });
});
