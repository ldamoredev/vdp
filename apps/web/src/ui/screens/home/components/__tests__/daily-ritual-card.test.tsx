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

beforeEach(() => {
  globalThis.React = React;
});

describe("DailyRitualCard", () => {
  it("renders a resume CTA when a review is already in progress", () => {
    const markup = renderToStaticMarkup(
      createElement(DailyRitualCard, {
        model: {
          statusLabel: "2 de 4 bloques resueltos",
          href: "/review",
          ctaLabel: "Retomar ritual",
          taskCount: 2,
          walletCount: 1,
          insightCount: 1,
        },
      }),
    );

    expect(markup).toContain("Retomar ritual");
    expect(markup).toContain("/review");
    expect(markup).toContain("sm:flex-row");
    // CTA stretches full-width on mobile and shrinks to auto on larger screens.
    expect(markup).toContain("w-full");
    expect(markup).toContain("sm:w-auto");
  });
});
