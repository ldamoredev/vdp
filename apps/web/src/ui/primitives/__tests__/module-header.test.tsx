import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeartPulse } from "lucide-react";
import { describe, expect, it } from "vitest";

import { ModuleHeader } from "../module-header";

describe("ModuleHeader", () => {
  it("renders the module orientation pattern with eyebrow, display H2 and accent icon", () => {
    const markup = renderToStaticMarkup(
      createElement(ModuleHeader, {
        eyebrow: "CENTRO OPERATIVO",
        title: "Health",
        description: "Hábitos, peso y metas en un mismo ritmo.",
        icon: createElement(HeartPulse, { size: 20 }),
      }),
    );

    expect(markup).toContain("CENTRO OPERATIVO");
    expect(markup).toContain("<h2");
    expect(markup).toContain("font-display");
    expect(markup).toContain("bg-[var(--accent-glow)]");
    expect(markup).toContain("text-[var(--accent)]");
    expect(markup).toContain("Hábitos, peso y metas");
  });
});
