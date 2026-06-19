import { readFileSync } from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss(): string {
  return readFileSync(path.resolve(process.cwd(), "src/globals.css"), "utf-8");
}

describe("Tinta Iris design tokens", () => {
  it("promotes shared motion, typography, spacing and layout tokens", () => {
    const css = readGlobalsCss();

    expect(css).toContain("--ease-spring: cubic-bezier(0.22, 1, 0.36, 1);");
    expect(css).toContain("--tracking-eyebrow: 0.15em;");
    expect(css).toContain("--text-2xl: 24px;");
    expect(css).toContain("--space-8: 32px;");
    expect(css).toContain("--icon-rail-width: 56px;");
    expect(css).toContain("--sidebar-width: 192px;");
    expect(css).toContain("--header-height: 56px;");
    expect(css).toContain("--tab-bar-height: 56px;");
    expect(css).toContain("--tabbar-height: var(--tab-bar-height);");
  });

  it("keeps status and backdrop utilities available without hardcoded consumers", () => {
    const css = readGlobalsCss();

    expect(css).toContain("--stuck-rail: var(--accent-red);");
    expect(css).toContain(".aurora-field::before");
    expect(css).toContain(".aurora-field::after");
    expect(css).toContain(".animate-toast-in");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
