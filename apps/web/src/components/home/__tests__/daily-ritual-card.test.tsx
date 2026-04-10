import React, { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => createElement("a", { href, className }, children),
}));

import { DailyRitualCard } from "../daily-ritual-card";

beforeEach(() => {
  globalThis.React = React;
});

describe("DailyRitualCard", () => {
  it("renders a resume CTA when a review is already in progress", () => {
    const markup = renderToStaticMarkup(
      createElement(DailyRitualCard, {
        statusLabel: "2 de 4 bloques resueltos",
        href: "/review",
        ctaLabel: "Retomar ritual",
        taskCount: 2,
        walletCount: 1,
        insightCount: 1,
      }),
    );

    expect(markup).toContain("Retomar ritual");
    expect(markup).toContain("/review");
  });
});
