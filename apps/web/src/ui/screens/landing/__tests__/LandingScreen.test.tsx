import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("@/ui/primitives/theme-toggle", () => ({
  ThemeToggle: () => createElement("button", { type: "button" }, "Tema"),
}));

import LandingScreen from "../LandingScreen";

describe("LandingScreen", () => {
  it("shows Metas as an active module", () => {
    const markup = renderToStaticMarkup(createElement(LandingScreen));

    expect(markup).toContain("Metas");
    expect(markup).toContain("Objetivos de vida");
    expect(markup).toContain('href="/objectives"');
    expect(markup).toContain("5</span>");
  });
});
