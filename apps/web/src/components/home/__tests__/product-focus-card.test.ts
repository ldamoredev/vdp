import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { domains } from "@/lib/navigation";
import { ProductFocusCard } from "../product-focus-card";

describe("ProductFocusCard", () => {
  it("derives the active modules from the navigation source of truth", () => {
    const liveDomains = domains.filter((domain) => !domain.disabled);
    const liveModuleList =
      liveDomains.length === 2
        ? `${liveDomains[0]?.label} y ${liveDomains[1]?.label}`
        : liveDomains.map((domain) => domain.label).join(", ");

    const markup = renderToStaticMarkup(createElement(ProductFocusCard));

    expect(markup).toContain(`${liveModuleList} son los modulos activos`);
    expect(markup).toContain(`${liveDomains.length} dominios`);
    liveDomains.forEach((domain) => {
      expect(markup).toContain(domain.label);
    });
  });
});
